// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var ContentHeaderToggleButtonView = require('./contentHeaderToggleButtonView');
  
  var SortsButtonView = ContentHeaderToggleButtonView.extend({
    toggleSortDirection() {
      this.direction = this.direction === -1 ? 1 : -1;
      this.$('.item').removeClass('selected');
      this.$('item input[type="radio"]:selected').parent('.item').$('i.asc').toggle(this.direction === 1);
      this.$('item input[type="radio"]:selected').parent('.item').$('i.desc').toggle(this.direction === -1);
    },
    onItemClicked(event) {
      const $selected = $(event.currentTarget);
      this.$('.item').removeClass('selected');
      $selected.addClass('selected');
      this.toggleSortDirection();

      const eventName = `${this.data.type}:${$selected.attr('data-event')}`;
      Origin.trigger(eventName, this.direction);
    }
  }, {
    defaultButtonIcon: 'fa-sort',
    defaultButtonText: Origin.l10n.t('app.sort'),
    itemTemplate: 'sortItem'
  });

  return SortsButtonView;
});
