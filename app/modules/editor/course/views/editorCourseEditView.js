// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var EditorOriginView = require('../../global/views/editorOriginView');

  var EditorCourseEditView = EditorOriginView.extend({
    className: "course-edit",
    tagName: "div",

    preRender: function() {
      this.listenTo(Origin, 'projectEditSidebar:views:save', this.save);

      if (this.model.isNew()) {
        this.isNew = true;
        this.$el.addClass('project-detail-hide-hero');
      }
      // This next line is important for a proper PATCH request on saveProject()
      this.originalAttributes = _.clone(this.model.attributes);
    },

    getAttributesToSave: function() {
      var changedAttributes = this.model.changedAttributes(this.originalAttributes);
      // should also include anything that's new 
      var newAttributes = _.omit(this.model.attributes, Object.keys(this.originalAttributes));
      _.extend(changedAttributes, newAttributes);

      if(!changedAttributes) {
        return null;
      }
      return _.pick(this.model.attributes, Object.keys(changedAttributes));
    },

    save: async function() {
      if(!this.isNew) {
        return EditorOriginView.prototype.save.apply(this);
      }
      this.form.commit();
      this.model.pruneAttributes();
      try {
        const course = await $.ajax({ 
          url: '/api/content/createcourse',
          method: 'POST',
          data: JSON.stringify(this.model.attributes), 
          contentType: 'application/json' 
        });
        Origin.router.navigateTo(`editor/${course._id}/menu`);
      } catch(jqXhr) {
        this.onSaveError(undefined, jqXhr.responseJSON && jqXhr.responseJSON.message)
      }
    },
  }, {
    template: 'editorCourseEdit'
  });

  return EditorCourseEditView;
});
