// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  const Backbone = require('backbone');
  const Origin = require('core/origin');
  const ContentHeaderView = require('./views/contentHeaderView');
  const ActionsButtonView = require('./views/actionsButtonView');
  const OptionsView = require('./views/optionsView');

  const VIEWS = {
    actions: ActionsButtonView,
    options: OptionsView
  };

  class ContentHeader {
    get ITEM_TYPES() {
      return {
        OPTIONS: 'options',
        SORTS: 'sorts',
        FILTERS: 'filters',
        ACTIONS: 'actions'
      };
    }
    constructor() {
      this.data = Object.values(this.ITEM_TYPES).reduce((data, type) => Object.assign(data, { [type]: { items: [], view: VIEWS[type] } }), {});
      Origin.on('appHeader:postRender', this.render.bind(this));
    }
    render() {
      const $el = new ContentHeaderView().$el;
      $('#app').prepend($el);
      Origin.on('contentHeader:postRender', () => {
        this.$el = $el;
        this.renderItems();
      });
    }
    renderItems() {
      if(!this.$el) {
        return;
      }
      for (let type in this.data) {
        const { view, items } = this.data[type];
        if(!items.length) {
          continue;
        }
        const $el = $(`.buttons > .${type}`, this.$el);
        $el.empty();
        if(type === 'options') { // legacy
          $el.append(new view({ collection: new Backbone.Collection(items) }).$el);
          return;
        }
        for (let item of items) $el.append(new view(item).$el);
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
});
