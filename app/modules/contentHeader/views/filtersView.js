// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var ContentHeaderToggleView = require('./contentHeaderToggleView');
  
  var FiltersView = ContentHeaderToggleView.extend({
    async preRender() {
      if(this.data.groups.some(({ items }) => items.some(f => f.type === 'tags'))) {
        this.data.tags = (await $.post('api/tags/query'));
      }
    },
    onItemClicked(event) {
      event.stopPropagation();
      const $target = $(event.target);
      let eventData = $target.val() || $target.attr('data-value');
      
      if($target.hasClass('tag')) {
        $target.toggleClass('selected');
        eventData = $('.tag.selected', this.$el).toArray().map(t => $(t).attr('data-value'));
      }
      const eventName = `${this.data.type}:${$(event.currentTarget).attr('data-event')}`;
      Origin.trigger(eventName, eventData);
    }
  }, {
    defaultButtonIcon: 'fa-filter',
    defaultButtonText: Origin.l10n.t('app.filter'),
    itemTemplate: 'filterItem'
  });

  return FiltersView;
});
