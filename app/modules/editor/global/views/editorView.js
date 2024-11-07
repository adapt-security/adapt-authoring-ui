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
        'editorView:cut': this.cutToClipboard,
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
      if(this.isBuilding/*  || !this.validateCourse() */) {
        return;
      } 
      const isPreview = type === 'preview';
      let previewWindow;
      
      if(isPreview) {
        previewWindow = window.open('loading', 'preview');
      }
      try {
        this.isBuilding = true;
        const data = await $.post(`api/adapt/${type}/${Origin.editor.data.course.get('_courseId')}`);
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

    cutToClipboard: function(model) {
      //this.showPasteZones(model.get('_type'));
      Origin.editor.clipboard = [model];
      Origin.editor.clipboardCut = true;
    },

    addToClipboard: function(model) {
      //this.showPasteZones(model.get('_type'));
      Origin.editor.clipboard = [model];
      Origin.editor.clipboardCut = false;
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
      const source = _.last(Origin.editor.clipboard);
      const target = Origin.editor.data.content.findWhere({'_id': _parentId});
      const isCut = Origin.editor.clipboardCut;
      console.log(`paste ${source.get('_type')} (${source.get('_id')}) into ${target.get('_type')} (${target.get('_id')}) isCut=${isCut}`);
      Origin.trigger('editorView:pasteCancel');
      $.ajax({
        method: 'POST',
        url: 'api/content/clone',
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({ _id: source.get('_id'), _layout, _parentId, _sortOrder, isCut }),
        success: newData => {
          Origin.editor.clipboardCut = false;
          Origin.trigger(`editorView:pasted:${_parentId}`, newData);
          Origin.editor.data.load();
        },
        error: (jqXhr) => {
          const message = jqXhr.responseJSON.message || Origin.l10n.t('app.errorpaste')
          Origin.Notify.toast({ type: 'error', text: message });
        }
      });
    },

    renderCurrentEditorView: function() {
      Origin.trigger('editorView:removeSubViews');

      this.removeChildViews();

      const ViewClass = this.currentView === 'menu' ? EditorMenuView : EditorPageView;
      const view = new ViewClass({ model: this.model });
      this.addChildView(view, false);
      this.$('.editor-inner').html(view.$el);
      
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
