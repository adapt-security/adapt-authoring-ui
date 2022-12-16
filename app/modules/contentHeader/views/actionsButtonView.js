// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var ContentHeaderButtonView = require('./contentHeaderButtonView');

  var ActionsButtonView = ContentHeaderButtonView.extend({
    async preRender() {
      if(!this.data.buttonClass) this.data.buttonClass = 'action-primary';
    }
  }, {
    template: 'actionsButton'
  });

  return ActionsButtonView;
});
