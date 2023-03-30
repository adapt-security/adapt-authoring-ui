define([ 'core/origin', 'backboneForms' ], function(Origin, BackboneForms) {
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
        create: async (title, callback) => callback(await $.post('api/tags', { title })),
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
        onLoad: () => this.setValue.bind(this.value),
        onItemAdd: this.onAddTag.bind(this),
        onItemRemove: this.onRemoveTag.bind(this)
      });
    },

    getValue: function() {
      const val = this.$el[0].selectize.getValue();
      return val ? val.split(',') : [];
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

    onAddTag: async function(_id) {
      this.model.set('tags', [...this.model.get('tags'), _id]);
    },

    onRemoveTag: function(title) {
      this.model.set('tags', this.model.get('tags').filter(tag => tag.title !== title));
    }
  });

  Origin.on('origin:dataReady', function() {
    Origin.scaffold.addCustomField('Tags', ScaffoldTagsView);
  });

  return ScaffoldTagsView;
});
