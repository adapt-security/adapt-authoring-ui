// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var ContentHeaderToggleView = require('./contentHeaderToggleView');
  
  var SortsView = ContentHeaderToggleView.extend({
    render() {
      ContentHeaderToggleView.prototype.render.apply(this);
      this.updateIcon();
    },
    updateIcon() {
      this.$('.item').each((i, item) => {
        var $i = $(item);
        $('i', $i).hide();
        if(!$i.hasClass('selected') || this.direction === undefined) {
          $('i.default', $i).show();
        } else {
          $(`i.${this.direction === 1 ? 'asc' : 'desc'}`, $i).show();
        }
      });
    },
    onItemClicked(event) {
      event.preventDefault();
      event.stopPropagation();
      const $selected = $(event.currentTarget);
      if(!$selected.hasClass('selected')) {
        this.direction = 1;
        this.$('.item').removeClass('selected');
        $selected.addClass('selected');
      } else {
        this.direction = this.direction === 1 ? -1 : 1;
      }
      this.updateIcon();

      const eventName = `${this.data.type}:${$selected.attr('data-event')}`;
      Origin.trigger(eventName, this.direction);
    }
  }, {
    defaultButtonIcon: 'fa-sort',
    defaultButtonText: Origin.l10n.t('app.sort'),
    itemTemplate: 'sortItem'
  });

  return SortsView;
});
