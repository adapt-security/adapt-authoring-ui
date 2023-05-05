define([ 'core/origin'], function(Origin) {
  var ScaffoldContentIdView = Backbone.Form.editors.Base.extend({
    tagName: 'input',
    className: 'scaffold-contentid',
    events: {
      'change': function() { this.trigger('change', this); },
      'focus': function() { this.trigger('focus', this); },
      'blur': function() { this.trigger('blur', this); }
    },

    render: function() {
      _.defer(() => this.renderSelect());
      return this;
    },

    async renderSelect() {
      const _type = this.schema.inputType.split(':')[1] || undefined;
      const options = await $.post('api/content/query', { 
        _courseId: Origin.editor.data.course.get('_id'), 
        _type,
        $and: [
          { _type: { $ne: 'course' } },
          { _type: { $ne: 'config' } }
        ]
      });
      this.$el.selectize({
        valueField: '_id',
        labelField: 'title',
        optgroupField: '_type',
        searchField: ['displayTitle', 'title'],
        maxItems: 1,
        options
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
    }
  });

  Origin.on('origin:dataReady', function() {
    Origin.scaffold.addCustomField('ContentId', ScaffoldContentIdView);
    Origin.scaffold.addCustomField('ContentId:page', ScaffoldContentIdView);
    Origin.scaffold.addCustomField('ContentId:article', ScaffoldContentIdView);
    Origin.scaffold.addCustomField('ContentId:block', ScaffoldContentIdView);
    Origin.scaffold.addCustomField('ContentId:component', ScaffoldContentIdView);
  });

  return ScaffoldContentIdView;
});
