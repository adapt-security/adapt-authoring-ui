// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var ContentHeaderToggleView = require('./contentHeaderToggleView');
  
  var FiltersView = ContentHeaderToggleView.extend({
    async preRender() {
      let hasTags = false;
      this.data.groups.forEach(({ items }) => {
        items.forEach(i => {
          if(i.type === 'tags') hasTags = true;
        });
      });
      if(hasTags) this.data.tags = (await $.post('api/tags/query'));
    },
    onItemClicked(event) {
      event.stopPropagation();
      const $target = $(event.target);
      let value = $target.val() || $target.attr('data-value');
      
      if($target.hasClass('tag')) {
        $target.toggleClass('selected');
        value = $('.tag.selected', this.$el).toArray().map(t => $(t).attr('data-value'));
      }
      const allFilterData = {};
      const eventName = `${this.data.type}:${$(event.currentTarget).attr('data-event')}`;
      Origin.trigger(eventName, value, allFilterData);
    }
  }, {
    defaultButtonIcon: 'fa-filter',
    defaultButtonText: Origin.l10n.t('app.filter'),
    itemTemplate: 'filterItem'
  });

  return FiltersView;
});
