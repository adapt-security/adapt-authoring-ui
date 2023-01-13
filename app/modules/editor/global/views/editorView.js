// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/*
 * TODO I think this exists to add extra functionality to the menu/page structure pages
 */
define(function(require) {
  var ContenModel = require('core/models/contentModel');
  var EditorMenuView = require('../../courseStructure/views/editorMenuView');
  var EditorOriginView = require('./editorOriginView');
  var EditorPageView = require('../../pageStructure/views/editorPageView');
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
        'actions:publish': this.downloadProject,
        'actions:preview': this.previewProject,
        'actions:export': this.exportProject
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
      
      const previewWindow = window.open('loading', 'preview');
      
      $.post(`api/adapt/preview/${this.currentCourseId}`)
        .done(data => {
          previewWindow.location.href = data.preview_url;
        })
        .fail((jqXHR, textStatus, errorThrown) => {
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
      }
      return errors.length === 0;
    },

    exportProject: async function(error) {
      // TODO - very similar to export in project/views/projectView.js, remove duplication
      // aleady processing, don't try again
      if(error || this.exporting) return;

      this.exporting = true;
      if(!this.validateCourse()) {
        return;
      }
      $.ajax({
        url: `api/adapt/export/${Origin.editor.data.course.get('_id')}`,
        method: 'POST',
        success: data => {
          this.exporting = false;
          var $downloadForm = $('#downloadForm');
          $downloadForm.attr('action', data.export_url);
          $downloadForm.submit();
        },
        error: jqXHR => {
          this.exporting = false;
          Origin.Notify.alert({
            type: 'error',
            title: Origin.l10n.t('app.exporterrortitle'),
            text: Origin.l10n.t('app.errorgeneric') + Origin.l10n.t('app.debuginfo', { message: jqXHR.responseJSON.message })
          });
        }
      });
    },

    downloadProject: function() {
      if(Origin.editor.isDownloadPending) {
        return;
      }
      if(!this.validateCourse()) {
        return;
      }
      $('.editor-common-sidebar-download-inner').addClass('display-none');
      $('.editor-common-sidebar-downloading').removeClass('display-none');

      $.ajax({
        url: `api/adapt/publish/${this.currentCourseId}`,
        method: 'POST',
        success: (data, textStatus, jqXHR) => {
          var $downloadForm = $('#downloadForm');
          $downloadForm.attr('action', data.publish_url);
          $downloadForm.submit();
        },
        error: jqXHR => {
          Origin.Notify.alert({
            type: 'error',
            text: Origin.l10n.t('app.errorgeneric') + Origin.l10n.t('app.debuginfo', { message: jqXHR.responseJSON.message })
          });
        }
      });
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
          Origin.trigger('editorView:menuView:addItem', new ContentModel(newData))
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
        case 'contentObjects': return new ContentModel({ _type: 'contentobject' });
        case 'articles': return new ContentModel({ _type: 'article' });
        case 'blocks': return new ContentModel({ _type: 'block' });
        case 'components': return new ContentModel({ _type: 'component' });
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
