// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var ContentHeaderToggleView = require('./contentHeaderToggleView');
  
  var FiltersView = ContentHeaderToggleView.extend({
    async preRender() {
      if(this.data.groups.some(({ items }) => items.some(i => i.type === 'tags'))) {
        this.data.tags = (await $.post('api/tags/query'));
      }
    },
    getFilterData() {
      const data = {};
      this.data.groups.forEach((group) => {
        if(group.id) data[group.id] = {};
        const dataObj = group.id ? data[group.id] : data;
        group.items.forEach(item => dataObj[item.id] = this.getItemValue(group, item));
      });
      return data;
    },
    getItemValue(group, item) {
      const $item = $(`.group[data-index="${group.index}"] .item[data-index="${item.index}"]`);
      switch(item.type) {
        case 'search':
          return $('input', $item).val();
        case 'toggle':
          return !!$('input', $item).attr('checked');
        case 'search':
          return $('.tag.selected', $item).toArray().map(t => $(t).attr('data-value'));
      }
    },
    onItemClicked(event) {
      const $target = $(event.currentTarget);
      const type = $target.attr('data-type');

      if(type === 'toggle' && $(event.target).prop('tagName') === 'input') {
        return;
      }
      if(type === 'tag') {
        $target.toggleClass('selected');
      }
      Origin.trigger(this.data.type, this.getFilterData());
    }
  }, {
    defaultButtonIcon: 'fa-filter',
    defaultButtonText: Origin.l10n.t('app.filter'),
    itemTemplate: 'filterItem'
  });

  return FiltersView;
});
