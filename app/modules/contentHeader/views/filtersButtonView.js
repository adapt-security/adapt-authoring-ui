// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var ContentHeaderToggleButtonView = require('./contentHeaderToggleButtonView');
  
  var FiltersButtonView = ContentHeaderToggleButtonView.extend({
    async preRender() {
      if(!this.data.buttonText) this.data.buttonText = Origin.l10n.t('app.filter');

      if(this.data.items.some(f => f.type === 'tags')) {
        this.data.tags = (await $.post('api/tags/query'));
      }
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
      Origin.trigger(eventName, eventData);
    }
  }, {
    template: 'filtersButton'
  });

  return FiltersButtonView;
});
