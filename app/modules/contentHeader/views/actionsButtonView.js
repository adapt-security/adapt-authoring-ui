// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var Backbone = require('backbone');

  var ActionsButtonView = Backbone.View.extend({
    className: 'actions-button',

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
      var template = Handlebars.templates[this.constructor.template];
      this.$el.html(template(this.data));
      return this;
    },

    onClicked: function(event) {
      event && event.preventDefault();
      alert('action clicked')
    }
  }, {
    template: 'actionsButton'
  });

  return ActionsButtonView;
});
