define([
  'backbone-forms',
  'core/origin'
], function(BackboneForms, Origin) {
    var ScaffoldFileView = Backbone.Form.editors.Base.extend({
      render: function() {
        this.$el.html(Handlebars.templates[this.constructor.template]({ name: this.getName() }));
        return this;
      },
      getValue: function() {
        return this.$el ? this.$el.val() : undefined;
      },
    }, { template: 'scaffoldFile' });
  
  Origin.on('origin:dataReady', () => Origin.scaffold.addCustomField('File', ScaffoldFileView));

  return ScaffoldFileView;
});
