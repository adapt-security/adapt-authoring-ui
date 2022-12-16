// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var ContentHeaderButtonView = require('./contentHeaderButtonView');
  
  var FiltersButtonView = ContentHeaderButtonView.extend({
    events() {
      return Object.assign(ContentHeaderButtonView.prototype.events, {
        'click .filter-item': 'onItemClicked'
      });
    },
    async preRender() {
      if(!this.data.buttonText) this.data.buttonText = Origin.l10n.t('app.filter');

      if(this.data.filters.some(f => f.type === 'tags')) {
        this.data.tags = (await $.post('api/tags/query'));
      }
    },
    onClicked() {
      $('.filter-buttons', this.$el).toggleClass('show');
    },
    onItemClicked(event) {
      const $target = $(event.target);
      if($target.prop("tagName") === 'LABEL') {
        return;
      }
      let eventData = $target.val() || $target.attr('data-value');
      
      if($target.hasClass('tag')) {
        $target.toggleClass('selected');
        eventData = $('.tag.selected', this.$el).toArray().map(t => $(t).attr('data-value'));
      }
      const eventName = `${this.data.type}:${$(event.currentTarget).attr('data-event')}`;
      console.log(eventName, eventData);
      Origin.trigger(eventName, $target.val());
    }
  }, {
    template: 'filtersButton'
  });

  return FiltersButtonView;
});
