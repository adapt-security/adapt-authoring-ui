// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var Backbone = require('backbone');

  var ContentHeaderButtonView = Backbone.View.extend({
    className: 'contentHeader-button',
    tagName: 'span',

    events: {
    'click button': 'onClicked'
    },

    initialize: function(options) {
      this.listenTo(Origin, 'remove:views', this.remove);

      this.data = options;
      if(!this.data.buttonClass) this.data.buttonClass = 'action-primary';
      this.render();
    },

    render: function() {
      this.$el.html(Handlebars.templates[this.constructor.template](this.data));
      return this;
    },

    getEventName: function() {
      return this.data.eventName;
    },

    onClicked: function(event) {
      event && event.preventDefault();
      Origin.trigger(this.getEventName($(event.currentTarget)));
    }
  });

  return ContentHeaderButtonView;
});
