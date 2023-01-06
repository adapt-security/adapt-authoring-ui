// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var ContentHeaderButtonsView = require('./contentHeaderButtonsView');

  var ActionsView = ContentHeaderButtonsView.extend({
    preRender() {
      this.data.groups.forEach(group => {
        group.items.forEach(item => {
          if(!item.buttonClass) item.buttonClass = 'action-primary';
          item.buttonClass += ' action';
        });
      });
    }
  }, {
    itemTemplate: 'buttonItem'
  });

  return ActionsView;
});
