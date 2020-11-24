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
        'editorCommon:preview': function(isForceRebuild) {
          var previewWindow = window.open('loading', 'preview');
          this.previewProject(previewWindow, isForceRebuild);
        },
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

    previewProject: function(previewWindow, forceRebuild) {
      if(Origin.editor.isPreviewPending) {
        return;
      }
      Origin.editor.isPreviewPending = true;
      $('.navigation-loading-indicator').removeClass('display-none');
      $('.editor-common-sidebar-preview-inner').addClass('display-none');
      $('.editor-common-sidebar-previewing').removeClass('display-none');

      $.post('api/adapt/preview/' + this.currentCourseId + '?force='+(forceRebuild === true))
        .done(data => {
          this.resetPreviewProgress();
          previewWindow.location.href = data.preview_url;
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
          this.resetPreviewProgress();
          Origin.Notify.alert({
            type: 'error',
            text: Origin.l10n.t('app.errorgeneratingpreview') + Origin.l10n.t('app.debuginfo', { message: jqXHR.responseJSON.message })
          });
          previewWindow.close();
        });
    },

    exportProject: function(error) {
      // TODO - very similar to export in project/views/projectView.js, remove duplication
      // aleady processing, don't try again
      if(error || this.exporting) return;

      var $btn = $('button.editor-common-sidebar-export');

      this.showExportAnimation(true, $btn);
      this.exporting = true;

      var self = this;
      $.ajax({
        url: `api/adapt/export/${Origin.editor.data.course.get('_id')}`,
        method: 'POST',
        success: data => {
          self.showExportAnimation(false, $btn);
          self.exporting = false;
          var $downloadForm = $('#downloadForm');
          $downloadForm.attr('action', data.export_url);
          $downloadForm.submit();
        },
        error: jqXHR => {
          self.showExportAnimation(false, $btn);
          self.exporting = false;
          Origin.Notify.alert({
            type: 'error',
            title: Origin.l10n.t('app.exporterrortitle'),
            text: Origin.l10n.t('app.errorgeneric') + Origin.l10n.t('app.debuginfo', { message: jqXHR.responseJSON.message })
          });
        }
      });
    },

    showExportAnimation: function(show, $btn) {
      if(show !== false) {
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
        error: () => {
          this.resetDownloadProgress();
          Origin.Notify.alert({ type: 'error', text: Origin.l10n.t('app.errorgeneric') });
        }
      });
    },

    updateDownloadProgress: function(url) {
      // Check for updated progress every 3 seconds
      var pollId = setInterval(_.bind(function pollURL() {
        $.get(url, function(jqXHR, textStatus, errorThrown) {
          if (jqXHR.progress < "100") {
            return;
          }
          clearInterval(pollId);
          this.resetDownloadProgress();
        }).fail(function(jqXHR, textStatus, errorThrown) {
          clearInterval(pollId);
          this.resetDownloadProgress();
          Origin.Notify.alert({ type: 'error', text: errorThrown });
        });
      }, this), 3000);
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
      var postData = {
        objectId: model.get('_id'),
        courseId: Origin.editor.data.course.get('_id'),
        referenceType: model._siblingTypes
      };
      $.post('api/content/clipboard/copy', postData, _.bind(function(jqXHR) {
        Origin.editor.clipboardId = jqXHR.clipboardId;
        this.showPasteZones(model.get('_type'));
      }, this)).fail(_.bind(function (jqXHR, textStatus, errorThrown) {
        Origin.Notify.alert({
          type: 'error',
          text: Origin.l10n.t('app.errorcopy') + (jqXHR.message ? '\n\n' + jqXHR.message : '')
        });
        this.hidePasteZones();
      }, this));
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
          text: Origin.l10n.t('app.app.copyidtoclipboarderror', { id: id })
        });
      }
    },

    pasteFromClipboard: function(parentId, sortOrder, layout) {
      Origin.trigger('editorView:pasteCancel');
      var postData = {
        id: Origin.editor.clipboardId,
        parentId: parentId,
        layout: layout,
        sortOrder: sortOrder,
        courseId: Origin.editor.data.course.get('_id')
      };
      $.post('api/content/clipboard/paste', postData, function(data) {
        Origin.editor.clipboardId = null;
        Origin.trigger(`editorView:pasted:${postData.parentId}`, { _id: data._id, sortOrder: postData.sortOrder });
      }).fail(jqXHR => {
        Origin.Notify.alert({
          type: 'error',
          text: `${Origin.l10n.t('app.errorpaste')}${jqXHR.message ? `\n\n${jqXHR.message}` : ''}`
        });
      });
    },

    createModel: function (type) {
      var model;
      switch (type) {
        case 'contentObjects':
          model = new ContentObjectModel();
          break;
        case 'articles':
          model = new ArticleModel();
          break;
        case 'blocks':
          model = new BlockModel();
          break;
        case 'components':
          model = new ComponentModel();
          break;
      }
      return model;
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

    /**
    * Event handling
    */

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
