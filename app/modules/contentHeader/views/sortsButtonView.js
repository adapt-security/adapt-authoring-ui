// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var ContentHeaderButtonView = require('./contentHeaderButtonView');
  
  var SortsButtonView = ContentHeaderButtonView.extend({
    events() {
      return Object.assign(ContentHeaderButtonView.prototype.events, {
        'click .item': 'onItemClicked'
      });
    },
    async preRender() {
      if(!this.data.buttonText) this.data.buttonText = Origin.l10n.t('app.sort');
    },
    toggleSortDirection() {
      this.direction = this.direction === -1 ? 1 : -1;
      this.$('.item').removeClass('selected');
      this.$('item input[type="radio"]:selected').parent('.item').$('i.asc').toggle(this.direction === 1);
      this.$('item input[type="radio"]:selected').parent('.item').$('i.desc').toggle(this.direction === -1);
    },
    onClicked() {
      $('.buttons-container', this.$el).toggleClass('show');
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
    template: 'sortsButton'
  });

  return SortsButtonView;
});
