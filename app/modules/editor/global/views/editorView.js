// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/*
 * TODO I think this exists to add extra functionality to the menu/page structure pages
 */
define(function(require) {
  var ContentModel = require('core/models/contentModel');
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

      this.listenTo(Origin, {
        'editorView:refreshView': this.setupEditor,
        'editorView:copy': this.addToClipboard,
        'editorView:copyID': this.copyIdToClipboard,
        'editorView:paste': this.pasteFromClipboard,
        'actions': this.buildProject,
      });
      this.render();
      this.renderCurrentEditorView();
    },

    postRender: function() {

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
      
      validateChildren(Origin.editor.data.course);

      if(errors.length) {
        Origin.Notify.toast({ type: 'warning', html: errors.join('<br/>') });
      }
      return errors.length === 0;
    },

    buildProject: async function(type) {
      const invalidType = type !== 'preview' && type !== 'publish' && type !== 'export';
      
      if(invalidType || this.isBuilding || !this.validateCourse()) {
        return;
      } 
      const isPreview = type === 'preview';
      let previewWindow;
      
      if(isPreview) {
        previewWindow = window.open('loading', 'preview');
      }
      try {
        this.isBuilding = true;
        const data = await $.post(`api/adapt/${type}/${Origin.editor.data.course.get('_id')}`);
        if(isPreview) {
          previewWindow.location.href = data.preview_url;
        } else {
          Origin.Notify.toast({ type: 'info', text: Origin.l10n.t('app.buildready') });
          const $tempForm = $(`<form method="get" action="${data[`${type}_url`]}"></form>`);
          $('body').append($tempForm);
          $tempForm.trigger('submit');
          $tempForm.remove();
        }
      } catch(e) {
        if(isPreview) {
          previewWindow.close();
        }
        Origin.Notify.toast({
          type: 'error',
          title: Origin.l10n.t('app.builderrortitle'),
          debugInfo: e.responseJSON.message,
          persist: true
        });
      }
      this.isBuilding = false;
    },

    addToClipboard: function(model) {
      this.showPasteZones(model.get('_type'));
      Origin.editor.clipboardId = model.get('_id');
    },

    copyIdToClipboard: function(model) {
      var id = model.get('_id');

      if (helpers.copyStringToClipboard(id)) {
        Origin.Notify.toast({ type: 'success', text: Origin.l10n.t('app.copyidtoclipboardsuccess', { id }) });
      } else {
        Origin.Notify.toast({
          type: 'warning',
          text: Origin.l10n.t('app.copyidtoclipboarderror', { id })
        });
      }
    },

    pasteFromClipboard: function(_parentId, _sortOrder, _layout) {
      Origin.trigger('editorView:pasteCancel');

      const { SweetAlert } = Origin.Notify.alert({ title: Origin.l10n.t('app.loading') });
      SweetAlert.showLoading();

      $.ajax({
        method: 'POST',
        url: 'api/content/clone',
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({ _id: Origin.editor.clipboardId, _layout, _parentId, _sortOrder }),
        success: newData => {
          Origin.editor.clipboardId = null;
          Origin.trigger(`editorView:pasted:${_parentId}`, newData);
          Origin.trigger('editor:refreshData', () => {
            Origin.trigger(`editorView:refreshView`);
          });
          SweetAlert.close();
        },
        fail: ({ message }) => {
          SweetAlert.close();
          Origin.Notify.toast({ type: 'error', text: `${Origin.l10n.t('app.errorpaste')}${message ? `\n\n${message}` : ''}` });
        }
      });
    },

    renderCurrentEditorView: function() {
      Origin.trigger('editorView:removeSubViews');

      const ViewClass = this.currentView === 'menu' ? EditorMenuView : EditorPageView;
      this.$('.editor-inner').html(new ViewClass({ model: this.model }).$el);
      
      Origin.trigger('editorSidebarView:addOverviewView');
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
