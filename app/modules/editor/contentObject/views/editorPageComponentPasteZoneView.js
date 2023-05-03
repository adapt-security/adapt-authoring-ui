// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Origin = require('core/origin');
  var EditorPasteZoneView = require('../../global/views/editorPasteZoneView');

  var EditorPageComponentPasteZone = EditorPasteZoneView.extend({
    className : 'paste-zone paste-zone-component display-none',
    events: {
      'click .editor-paste-zone-paste': 'onPasteElementClicked'
    },

    preRender: function () {
      this.listenTo(this.model, 'destroy', this.remove);
      this.listenTo(Origin, 'editorView:removeSubViews editorPageView:removePageSubViews', this.remove);
    },

    postRender: function () {
      var view = this;
      this.$el.addClass('paste-zone-component-' + this.model.get('_pasteZoneLayout'));
      this.$el.droppable({
        accept: el =>  el.hasClass('component-draggable') && this.$el.css('visibility') == 'visible',
        hoverClass: 'paste-zone-droppable',
        drop: function (e, ui) {
          var $component = $(ui.draggable);
          var contentId = $component.attr('data-component-id');
          var isLeft = $(this).hasClass('paste-zone-component-left');
          var isRight = $(this).hasClass('paste-zone-component-right');
          $.ajax({
            type: 'PATCH',
            url: `api/content/${contentId}`,
            data: {
              _layout: (!isLeft && !isRight) ? 'full' : (isLeft ? 'left' : 'right'),
              _parentId: view.model.get('_parentId')
            },
            success: () => Origin.trigger('editorView:renderPage'),
            error: ({ responseJSON }) => Origin.Notify.alert({ type: 'error', text: responseJSON.message })
          });
        }
      });
    }
  }, {
    template: 'editorPageComponentPasteZone'
  });

  return EditorPageComponentPasteZone;
});
