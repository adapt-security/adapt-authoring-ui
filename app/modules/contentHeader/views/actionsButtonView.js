// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var ContentHeaderButtonView = require('./contentHeaderButtonView');

  var ActionsButtonView = ContentHeaderButtonView.extend({
    preRender: function() {
      if(!this.data.buttonClass) this.data.buttonClass = 'action-primary';
    },

    getEventName($targetEl) {
      return `actions:${this.data.eventName}`;
    }
  }, {
    template: 'actionsButton'
  });

  return ActionsButtonView;
});
