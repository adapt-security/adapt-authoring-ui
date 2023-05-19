// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Origin = require('core/origin');
  var Helpers = require('core/helpers');
  var EditorOriginView = require('../../global/views/editorOriginView');

  var EditorPasteZoneView = EditorOriginView.extend({
    className: function() {
      return `display-none paste-zone ${this.customClasses}`;
    },
    events: {
      'click .editor-paste-zone-paste': 'onPasteElementClicked'
    },

    initialize: function(options) {
      this.customClasses = options.customClasses;
      EditorOriginView.prototype.initialize.apply(this, arguments);
    },

    preRender: function() {
      this.listenTo(this.model, 'destroy', this.remove);
      this.listenTo(Origin, 'editorView:removeSubViews editorPageView:removePageSubViews', this.remove);
    },

    postRender: function () {
      var type = this.model.get('_type');
      this.$el.addClass(`paste-zone-${type}`);
      this.$el.droppable({
        accept: `.${type}-draggable`,
        hoverClass: 'paste-zone-droppable',
        drop: _.bind(this.onDrop, this)
      });
    },

    // Event handling

    onPasteElementClicked: function(event) {
      event && event.preventDefault();

      var parentId = this.model.get('_parentId');
      var sortOrder = this.model.get('_pasteZoneSortOrder');
      var layout = this.model.get('_pasteZoneLayout');
      Origin.trigger('editorView:paste', parentId, sortOrder, layout);
    },

    onDrop: function(e, ui) {
      var type = this.model.get('_type');
      var $component = $(ui.draggable);
      var contentId = $component.attr(`data-${type}-id`);
      var _parentId = this.model.get('_parentId');
      var droppedOnId = $component.attr(`data-${this.model.get('_parent')}-id`);
      var _sortOrder = Number($(`.paste-${type}`, this.$el).attr('data-sort-order'));
      $.ajax({
        url: `api/content/${contentId}`,
        type: 'PATCH',
        contentType: 'application/json',
        data: JSON.stringify({ _parentId, _sortOrder }),
        success: function() {
          var eventPrefix = `editorView:move${Helpers.capitalise(type)}:`;
          Origin.trigger(eventPrefix + droppedOnId);
          // notify the old parent that the child's gone
          if(droppedOnId !== _parentId) Origin.trigger(eventPrefix + _parentId);
          Origin.editor.data.load();
        },
        error: function(jqXHR) {
          Origin.Notify.toast({ type: 'error', text: jqXHR.responseJSON.message });
        }
      });
    }
  }, {
    template: 'editorPasteZone'
  });

  return EditorPasteZoneView;
});
