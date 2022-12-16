// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  const Backbone = require('backbone');
  const Origin = require('core/origin');
  const ActionsButtonView = require('./actionsButtonView');
  const OptionsView = require('./optionsView');

  const VIEWS = {
    actions: ActionsButtonView,
    options: OptionsView
  };

  class ContentHeaderView {
    get BUTTON_TYPES() {
      return {
        OPTIONS: 'options',
        SORTS: 'sorts',
        FILTERS: 'filters',
        ACTIONS: 'actions'
      };
    }
    constructor() {
      this.data = {
        buttons: Object.values(this.BUTTON_TYPES).reduce((data, type) => {
          return { ...data, [type]: { items: [], ViewClass: VIEWS[type] } };
        }, {})
      };
      Origin.on('contentHeader:updateTitle', this.updateTitle.bind(this));
      Origin.on('contentHeader:hide', this.remove.bind(this));
      Origin.on('remove:views', this.remove.bind(this));
    }
    render() {
      this.remove(false);
      const template = Handlebars.templates.contentHeader;
      this.$el = $(template(this.getTemplateData()));
      $('#app').prepend(this.$el);
      // items
      for (let type in this.data.buttons) {
        const { ViewClass, items } = this.data.buttons[type];
        if(!items.length) {
          continue;
        }
        const $el = $(`.buttons > .${type}`, this.$el);
        if(type === 'options') { // legacy
          $el.append(new ViewClass({ collection: new Backbone.Collection(items) }).$el);
          continue;
        }
        for (let item of items) $el.append(new ViewClass({ type, ...item }).$el);
      }
    }
    getTemplateData() {
      if(!this.data.breadcrumbs) {
        return this.data;
      }
      const course = Origin.editor && Origin.editor.data && Origin.editor.data.course;

      return Object.assign(this.data, {
        course: course && course.get('title') !== this.data.title ? { title: course.get('title') } : undefined,
        breadcrumbs: this.data.breadcrumbs.map(b => {
          if(b === 'dashboard') {
            return { title: Origin.l10n.t('app.dashboard'), url: '#' };
          }
          if(b === 'course') {
            return { title: Origin.l10n.t('app.editormenu'), url: `#/editor/${course.get('_id')}/menu` };
          }
          return b;
        })
      });
    }
    updateTitle(data) {
      Object.assign(this.data, data);
      this.render();
    }
    setButtons(type, items) {
      if(!this.data.buttons[type]) {
        return console.error(`Unknown ContentHeader type '${type}', must be one of ${Object.keys(this.data.buttons)}`);
      }
      this.data.buttons[type].items = items;
      this.render();
    }
    remove(resetData = true) {
      if(this.$el) this.$el.remove();
      if(resetData) {
        delete this.data.course;
        delete this.data.breadcrumbs;
        for (let type in this.data.buttons) this.data.buttons[type].items = [];
      }
    }
  }

  return ContentHeaderView;
});
