// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var ContentHeaderButtonsView = require('./contentHeaderButtonsView');

  var LinksView = ContentHeaderButtonsView.extend({
    preRender() {
      if(!this.data.buttonClass) this.data.buttonClass = '';
      this.data.buttonClass += ' link';
    }
  }, {
    itemTemplate: 'buttonItem'
  });

  return LinksView;
});
