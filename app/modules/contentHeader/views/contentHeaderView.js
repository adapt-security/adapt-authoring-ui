// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  const Origin = require('core/origin');
  const ActionsView = require('./actionsView');
  const FiltersView = require('./filtersView');
  const LinksView = require('./linksView');
  const SortsView = require('./sortsView');

  const VIEWS = {
    actions: ActionsView,
    filters: FiltersView,
    links: LinksView,
    sorts: SortsView,
  };

  class ContentHeaderView {
    get BUTTON_TYPES() {
      return {
        ACTIONS: 'actions',
        FILTERS: 'filters',
        LINKS: 'links',
        SORTS: 'sorts'
      };
    }
    get ACTION_BUTTON_TEMPLATES() {
      return {
        EDIT_FORM: [{
          items: [
            {
              buttonText: Origin.l10n.t('app.save'),
              eventName: 'save'
            },
            {
              buttonText: Origin.l10n.t('app.cancel'),
              eventName: 'cancel',
              buttonClass: 'action-secondary'
            }
          ]
        }]
      };
    }
    constructor() {
      this.data = {
        buttons: Object.values(this.BUTTON_TYPES).reduce((data, type) => {
          return { ...data, [type]: { groups: [], ViewClass: VIEWS[type] } };
        }, {})
      };
      Origin.on('contentHeader:updateTitle', this.updateTitle.bind(this));
      Origin.on('router, contentHeader:hide, remove:views', this.remove.bind(this));
    }
    render() {
      this.remove(false);
      const template = Handlebars.templates.contentHeader;
      this.$el = $(template(this.getTemplateData()));
      $('#app').prepend(this.$el);
      // create buttons
      for (let type in this.data.buttons) {
        const { ViewClass, groups } = this.data.buttons[type];
        if(!groups.length) continue;
        $(`.${type}`, this.$el).append(new ViewClass({ type, groups }).$el);
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
    setButtons(type, groups) {
      if(!this.data.buttons[type]) {
        return console.error(`Unknown ContentHeader type '${type}', must be one of ${Object.keys(this.data.buttons)}`);
      }
      this.data.buttons[type].groups = groups;
      this.render();
    }
    remove(resetData = true) {
      if(this.$el) this.$el.remove();
      if(resetData) {
        for (let type in this.data.buttons) this.data.buttons[type].groups = [];
      }
    }
  }

  return ContentHeaderView;
});
