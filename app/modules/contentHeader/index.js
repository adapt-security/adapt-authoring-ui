// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/origin');
  var ContentHeaderView = require('./views/contentHeaderView');
  var OptionsView = require('./views/optionsView');

  class ContentHeader {
    get ITEM_TYPES() {
      return {
        ACTIONS: 'actions',
        FILTERS: 'filters',
        SORTS: 'sorts',
        OPTIONS: 'options'
      };
    }
    constructor() {
      this.data = Object.values(this.ITEM_TYPES).reduce((data, type) => {
        return { ...data, [type]: { items: [], view: Views[`${type[0].toUpperCase()}${type.slice(1)}View`] } };
      }, {});
      Origin.on('appHeader:postRender', this.render.bind(this));
    }
    render() {
      this.$el = new ContentHeaderView().$el;
      $('#app').prepend(this.$el);
      this.renderItems();
    }
    renderItems() {
      if(!this.$el) {
        return;
      }
      for (let type in this.data) {
        const items = this.data[type];
        let $el = '';
        if(items.length) $el = new Views[type]({ collection: new Backbone.Collection(items) }).$el;
        $(`.${type}`, this.$el).html($el);
      }
    }
    setItems(itemType, items) {
      if(!this.data[itemType]) {
        console.error(`Unknown ContentHeader type '${itemType}', must be one of ${Object.keys(this.data)}`);
      } else {
        this.data[itemType].items = items;
      }
      this.renderItems();
    }
  }

  Origin.contentHeader = new ContentHeader();
})
