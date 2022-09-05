// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/*
 * TODO I think this exists to add extra functionality to the menu/page structure pages
 */
define(function(require) {
  var ArticleModel = require('core/models/articleModel');
  var BlockModel = require('core/models/blockModel');
  var ComponentModel = require('core/models/componentModel');
  var ContentObjectModel = require('core/models/contentObjectModel');
  var EditorMenuView = require('../../contentObject/views/editorMenuView');
  var EditorOriginView = require('./editorOriginView');
  var EditorPageView = require('../../contentObject/views/editorPageView');
  var helpers = require('core/helpers');
  var Origin = require('core/origin');

  var EditorView = EditorOriginView.extend({
    className: "editor-view",
    tagName: "div",
    settings: {
      autoRender: false
    },
    exporting: false,
    events: {
      "click a.page-add-link": "addNewPage",
      "click a.load-page": "loadPage",
      "mouseover div.editable": "onEditableHoverOver",
      "mouseout div.editable": "onEditableHoverOut"
    },

    preRender: function(options) {
      this.currentView = options.currentView;
      Origin.editor.isPreviewPending = false;
      this.currentCourseId = Origin.editor.data.course.get('_id');
      this.currentCourse = Origin.editor.data.course;
      this.currentPageId = options.currentPageId;

      this.listenTo(Origin, {
        'editorView:refreshView': this.setupEditor,
        'editorView:copy': this.addToClipboard,
        'editorView:copyID': this.copyIdToClipboard,
        'editorView:paste': this.pasteFromClipboard,
        'editorCommon:download': this.downloadProject,
        'editorCommon:preview': this.previewProject,
        'editorCommon:export': this.exportProject
      });
      this.render();
      this.setupEditor();
    },

    postRender: function() {

    },

    setupEditor: function() {
      this.renderCurrentEditorView();
    },

    previewProject: function() {
      if(Origin.editor.isPreviewPending) {
        return;
      }
      if(!this.validateCourse()) {
        return;
      }
      Origin.editor.isPreviewPending = true;
      $('.navigation-loading-indicator').removeClass('display-none');
      $('.editor-common-sidebar-preview-inner').addClass('display-none');
      $('.editor-common-sidebar-previewing').removeClass('display-none');
      
      const previewWindow = window.open('loading', 'preview');
      
      $.post(`api/adapt/preview/${this.currentCourseId}`)
        .done(data => {
          this.resetPreviewProgress();
          previewWindow.location.href = data.preview_url;
        })
        .fail((jqXHR, textStatus, errorThrown) => {
          this.resetPreviewProgress();
          Origin.Notify.alert({
            type: 'error',
            text: Origin.l10n.t('app.errorgeneratingpreview') + Origin.l10n.t('app.debuginfo', { message: jqXHR.responseJSON.message })
          });
          previewWindow.close();
        });
    },

    validateCourse: function() {
      const errors = [];
      const validateChildren = item => {
        if(item.get('_type') === 'component') {
          return;
        }
        const children = Origin.editor.data.content.where({ _parentId: item.get('_id') });
        if(!children.length) {
          return errors.push(Origin.l10n.t('app.emptycontentobject', { type: item.get('_type'), title: item.get('title') }));
        }
        children.forEach(c => validateChildren(c));
      };
      
      validateChildren(this.currentCourse);

      if(errors.length) {
        Origin.Notify.alert({ type: 'error', html: errors.join('<br/>') });
        return false;
      }
    },

    exportProject: async function(error) {
      // TODO - very similar to export in project/views/projectView.js, remove duplication
      // aleady processing, don't try again
      if(error || this.exporting) return;

      this.showExportAnimation();
      this.exporting = true;
      if(this.validateCourse()) {
        return;
      }
      $.ajax({
        url: `api/adapt/export/${Origin.editor.data.course.get('_id')}`,
        method: 'POST',
        success: data => {
          this.showExportAnimation(false);
          this.exporting = false;
          var $downloadForm = $('#downloadForm');
          $downloadForm.attr('action', data.export_url);
          $downloadForm.submit();
        },
        error: jqXHR => {
          this.showExportAnimation(false);
          this.exporting = false;
          Origin.Notify.alert({
            type: 'error',
            title: Origin.l10n.t('app.exporterrortitle'),
            text: Origin.l10n.t('app.errorgeneric') + Origin.l10n.t('app.debuginfo', { message: jqXHR.responseJSON.message })
          });
        }
      });
    },

    showExportAnimation: function(show = true) {
      const $btn = $('button.editor-common-sidebar-export');
      if(show) {
        $('.editor-common-sidebar-export-inner', $btn).addClass('display-none');
        $('.editor-common-sidebar-exporting', $btn).removeClass('display-none');
      } else {
        $('.editor-common-sidebar-export-inner', $btn).removeClass('display-none');
        $('.editor-common-sidebar-exporting', $btn).addClass('display-none');
      }
    },

    downloadProject: function() {
      if(Origin.editor.isDownloadPending) {
        return;
      }
      if(this.validateCourse()) {
        return;
      }
      $('.editor-common-sidebar-download-inner').addClass('display-none');
      $('.editor-common-sidebar-downloading').removeClass('display-none');

      $.ajax({
        url: `api/adapt/publish/${this.currentCourseId}`,
        method: 'POST',
        success: (data, textStatus, jqXHR) => {
          this.resetDownloadProgress();
          var $downloadForm = $('#downloadForm');
          $downloadForm.attr('action', data.publish_url);
          $downloadForm.submit();
        },
        error: jqXHR => {
          this.resetDownloadProgress();
          Origin.Notify.alert({
            type: 'error',
            text: Origin.l10n.t('app.errorgeneric') + Origin.l10n.t('app.debuginfo', { message: jqXHR.responseJSON.message })
          });
        }
      });
    },
  
    resetPreviewProgress: function() {
      $('.editor-common-sidebar-preview-inner').removeClass('display-none');
      $('.editor-common-sidebar-previewing').addClass('display-none');
      $('.navigation-loading-indicator').addClass('display-none');
      $('.editor-common-sidebar-preview-wrapper .dropdown').removeClass('active');
      Origin.editor.isPreviewPending = false;
    },

    resetDownloadProgress: function() {
      $('.editor-common-sidebar-download-inner').removeClass('display-none');
      $('.editor-common-sidebar-downloading').addClass('display-none');
      Origin.editor.isDownloadPending = false;
    },

    addToClipboard: function(model) {
      this.showPasteZones(model.get('_type'));
      Origin.editor.clipboardId = model.get('_id');
    },

    copyIdToClipboard: function(model) {
      var id = model.get('_id');

      if (helpers.copyStringToClipboard(id)) {
        Origin.Notify.alert({
          type: 'info',
          text: Origin.l10n.t('app.copyidtoclipboardsuccess', { id: id })
        });
      } else {
        Origin.Notify.alert({
          type: 'warning',
          text: Origin.l10n.t('app.copyidtoclipboarderror', { id: id })
        });
      }
    },

    pasteFromClipboard: function(_parentId, _sortOrder, _layout) {
      Origin.trigger('editorView:pasteCancel');
      $.ajax({
        method: 'POST',
        url: 'api/content/clone',
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({ _id: Origin.editor.clipboardId, _layout, _parentId, _sortOrder }),
        success: newData => {
          Origin.editor.clipboardId = null;
          Origin.trigger('editorView:menuView:addItem', new ContentObjectModel(newData))
          Origin.trigger(`editorView:pasted:${_parentId}`, newData);
          Origin.trigger(`editorView:refreshView`);
        },
        fail: ({ message }) => {
          Origin.Notify.alert({ type: 'error', text: `${Origin.l10n.t('app.errorpaste')}${message ? `\n\n${message}` : ''}` });
        }
      });
    },

    createModel: function (type) {
      switch (type) {
        case 'contentObjects': return new ContentObjectModel();
        case 'articles': return new ArticleModel();
        case 'blocks': return new BlockModel();
        case 'components': return new ComponentModel();
      }
    },

    renderCurrentEditorView: function() {
      Origin.trigger('editorView:removeSubViews');

      if(this.currentView === 'menu') {
        this.renderEditorMenu();
      } else if(this.currentView === 'page') {
        this.renderEditorPage();
      }
      Origin.trigger('editorSidebarView:addOverviewView');
    },

    renderEditorMenu: function() {
      var view = new EditorMenuView({ model: Origin.editor.data.course });
      this.$('.editor-inner').html(view.$el);
    },

    renderEditorPage: function() {
      var model = Origin.editor.data.content.findWhere({ _id: this.currentPageId });
      var view = new EditorPageView({ model });
      this.$('.editor-inner').html(view.$el);
    },

    // Event handling

    onEditableHoverOver: function(e) {
      e && e.stopPropagation();
      $(e.currentTarget).addClass('hovering');
    },

    onEditableHoverOut: function(e) {
      $(e.currentTarget).removeClass('hovering');
    }
  }, {
    template: 'editor'
  });

  return EditorView;
});
