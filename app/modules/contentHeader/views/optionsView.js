// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var Backbone = require('backbone');

  var OptionsView = Backbone.View.extend({
    className: 'options',

    events: {
    'click button': 'onOptionClicked'
    },

    initialize: function() {
      this.eventsToTrigger = [];

      this.listenTo(Origin, {
        'remove:views': this.remove,
        'options:update:ui': this.updateUI,
        'options:reset:ui': this.resetUI
      });
      this.render();
    },

    render: function() {
      var template = Handlebars.templates[this.constructor.template];
      this.$el.html(template(this.getRenderData()));
      return this;
    },

    getRenderData: function() {
      const groups = {};
      this.collection.each(function(item) {
        if (_.indexOf(this.eventsToTrigger, item.get('callbackEvent')) > -1) {
          item.set('selected', true);
        }
        var itemGroup = item.get('group');
        if(!groups[itemGroup]) groups[itemGroup] = { items: [] };
        groups[itemGroup].items.push(item.toJSON());
      }, this);
      return { groups: Object.values(groups) };
    },

    updateUI: function(userPreferences) {
      // set selected preferences
      _.defer(_.bind(function() {
        _.each(userPreferences, function(preference) {
          if (_.isArray(preference)) return;
          this.$('button.option-value-' + preference).addClass('selected');
        }, this);
      }, this));
    },

    resetUI: function(group) {
      _.defer(_.bind(function() {
        this.$('button[data-group="'+group+'"]').removeClass('selected');
      }, this));
    },

    sortAndRenderGroups: function() {
      var availableGroups = _.uniq(this.collection.pluck('group'));
      var template = Handlebars.templates['optionsGroup'];
      _.each(availableGroups, function(group) {
        this.$('.options-inner').append(template({ group: group }));
      });
    },

    setSelectedOption: function(selectedOption) {
      var group = selectedOption.attr('data-group');
      if(group) {
        this.$('.options-group-' + group + ' button').removeClass('selected');
        selectedOption.addClass('selected');
      }
      var callbackEvent = selectedOption.attr('data-callback');
      if(callbackEvent) {
        Origin.trigger(callbackEvent);
      }
    },

    onOptionClicked: function(event) {
      event && event.preventDefault();
      this.setSelectedOption($(event.currentTarget));
    }
  }, {
    template: 'options'
  });

  return OptionsView;
});
