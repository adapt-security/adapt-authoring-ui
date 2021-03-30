// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var EditorOriginView = require('../../global/views/editorOriginView');

  var EditorComponentEditView = EditorOriginView.extend({
    className: "component-edit",
    tagName: "div",

    initialize: function() {
      if(this.isNew) {
        Origin.router.navigate(`#/editor/${this.model.get('_courseId')}/component/${this.model.get('_id')}`, { trigger: false });
      }
      EditorOriginView.prototype.initialize.call(this, arguments);
    },

    preRender: function() {
      this.listenTo(Origin, 'editorComponentEditSidebar:views:save', this.save);
    },

    cancel: function (event) {
      event && event.preventDefault();
      Origin.trigger('editorSidebarView:removeEditView', this.model);
    }
  }, {
    template: 'editorComponentEdit'
  });

  return EditorComponentEditView;
});
