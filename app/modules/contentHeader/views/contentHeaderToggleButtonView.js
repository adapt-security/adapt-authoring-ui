// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var ContentHeaderButtonView = require('./contentHeaderButtonView');

  var ContentHeaderToggleButtonView = ContentHeaderButtonView.extend({
    events() {
      return Object.assign(ContentHeaderButtonView.prototype.events, {
        'click .item': 'onItemClicked'
      });
    },
    onClicked() {
      $('.buttons-container', this.$el).toggleClass('show');
    },
    onItemClicked(event) {
    }
  });

  return ContentHeaderToggleButtonView;
}, {
  template: 'contentHeaderToggleButton'
});
