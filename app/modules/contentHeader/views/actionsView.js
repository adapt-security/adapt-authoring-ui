// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var ContentHeaderButtonsView = require('./contentHeaderButtonsView');

  var ActionsView = ContentHeaderButtonsView.extend({
    preRender() {
      if(!this.data.buttonClass) this.data.buttonClass = 'action-primary';
    }
  }, {
    itemTemplate: 'actionsItem'
  });

  return ActionsView;
});
