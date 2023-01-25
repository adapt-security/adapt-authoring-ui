// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var ContentHeaderToggleView = require('./contentHeaderToggleView');
  
  var FiltersView = ContentHeaderToggleView.extend({
    async preRender() {
      const tags = await $.post('api/tags/query');
      this.data.groups.forEach(({ items }) => items.forEach(i => i.type === 'tags' ? i.tags = tags : undefined));
    },
    render() {
      ContentHeaderToggleView.prototype.render.call(this, arguments);
      $('input[type=text]', this.$el).on('keyup', this.onItemClicked.bind(this));
      $('select', this.$el).on('change', this.onItemClicked.bind(this));
      return this;
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
      const $item = $(`.group[data-index="${group.index}"] .item[data-index="${item.index}"]`, this.$el);
      switch(item.type) {
        case 'search':
          return $('input', $item).val();
        case 'select':
          return $('select', $item).val();
        case 'tags':
          return $('.tag.selected', $item).toArray().map(t => $(t).attr('data-value'));
        case 'toggle':
          return $('input', $item).is(':checked');
      }
    },
    onClicked() {
      ContentHeaderToggleView.prototype.onClicked.call(this, arguments);
      if($('.groups', this.$el).hasClass('show')) {
        $('.groups input[type=text]', this.$el).first().trigger('focus');
      } else {
        $(document).trigger('focus');
      }
    },
    onItemClicked(event) {
      const $target = $(event.currentTarget);
      const type = $target.attr('data-type');

      if(type === 'search' || type === 'select' || type === 'toggle' && $(event.target).prop('tagName') !== 'INPUT') {
        return;
      }
      if(type === 'tags') {
        $(event.target).toggleClass('action-primary selected');
      }
      this.triggerEvent(this.getFilterData());
    }
  }, {
    defaultButtonIcon: 'fa-eye',
    defaultButtonText: Origin.l10n.t('app.view'),
    itemTemplate: 'filterItem'
  });

  return FiltersView;
});
