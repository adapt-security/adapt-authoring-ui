define([ 'core/origin', 'backbone-forms' ], function(Origin, BackboneForms) {
  var ScaffoldTagsView = Backbone.Form.editors.Base.extend({
    tagName: 'input',
    className: 'scaffold-tags',
    events: {
      'change': function() { this.trigger('change', this); },
      'focus': function() { this.trigger('focus', this); },
      'blur': function() { this.trigger('blur', this); }
    },

    render: function() {
      _.defer(this.postRender.bind(this));
      return this;
    },

    postRender: function() {
      this.$el.selectize({
        create: true,
        valueField: '_id',
        labelField: 'title',
        searchField: 'title',
        loadingClass: 'selectize-loading',
        preload: true,
        load: (query, callback) => {
          $.post('api/tags/query', { title: { $regex: `.*${query}.*`, $options: 'i' } })
            .done(callback)
            .error(() => callback());
        },
        onLoad: () => this.setValue(this.value),
        onItemAdd: this.onAddTag.bind(this),
        onItemRemove: this.onRemoveTag.bind(this)
      });
    },

    getValue: function() {
      return this.$el.val();
    },

    setValue: function(value) {
      this.$el[0].selectize.setValue(value);
    },

    focus: function() {
      if (!this.hasFocus) this.$el.focus();
    },

    blur: function() {
      if (this.hasFocus) this.$el.blur();
    },

    onAddTag: async function(value) {
      try {
        const { _id, title } = await $.post('api/tags', { title: value });
        this.model.set('tags', [...this.model.get('tags'), { _id, title }]);
      } catch(e) {
        Origin.Notify.alert({ type: 'error', text: `Failed to add tag.<br/><br/>${e.responseJSON.message}` });
      }
    },

    onRemoveTag: function(value) {
      this.model.set('tags', this.model.get('tags').filter(tag => tag.title !== value));
    }
  });

  Origin.on('origin:dataReady', function() {
    Origin.scaffold.addCustomField('Tags', ScaffoldTagsView);
  });

  return ScaffoldTagsView;
});
