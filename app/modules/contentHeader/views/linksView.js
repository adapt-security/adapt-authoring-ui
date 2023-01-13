// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var ContentHeaderButtonsView = require('./contentHeaderButtonsView');

  var LinksView = ContentHeaderButtonsView.extend({
    preRender() {
      this.data.groups.forEach(group => {
        group.items.forEach(item => {
          if(!item.buttonClass) item.buttonClass = '';
          if(!item.buttonClass.includes('link')) item.buttonClass += ' link';
        });
      });
    }
  }, {
    itemTemplate: 'buttonItem'
  });

  return LinksView;
});
