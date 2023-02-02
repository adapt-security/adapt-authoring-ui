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
              id: 'save'
            },
            {
              buttonText: Origin.l10n.t('app.cancel'),
              id: 'cancel',
              buttonClass: 'action-secondary'
            }
          ]
        }]
      };
    }
    constructor($container, eventId) {
      // each additional contentHeader must have a unique eventId to avoid event pollution
      const $existingHeaders = $('.contentHeader');
      if($existingHeaders.length) {
        $existingHeaders.each(h => {
          if($(h).attr('data-id') === eventId || ($(h).attr('data-id') && !eventId)) {
            const msg = eventId ? `ContentHeader instance already exists with the id '${eventId}'` : 'Must define a unique eventId'
            throw new Error(msg);
          }
        });
      }
      this.$container = $container;
      this.data = {
        eventId: eventId,
        buttons: Object.values(this.BUTTON_TYPES).reduce((data, type) => {
          return Object.assign(data, { [type]: { groups: [], ViewClass: VIEWS[type] } });
        }, {})
      };
      Origin.on('router contentHeader:hide remove:views', this.remove, this);
    }
    render() {
      this.remove(false);
      const template = Handlebars.templates.contentHeader;
      this.$el = $(template(this.getTemplateData()));
      if(this.data.eventId) this.$el.attr('data-id', this.data.eventId);
      this.$container ? this.$container.append(this.$el) : $('#app').prepend(this.$el);
      // create buttons
      for (let type in this.data.buttons) {
        const { ViewClass, groups } = this.data.buttons[type];
        if(!groups.length) continue;
        $(`.${type}`, this.$el).append(new ViewClass({ eventId: this.data.eventId, type, groups }).$el);
      }
    }
    getTemplateData() {
      if(!this.data.breadcrumbs) {
        const moduleTitles = {
          projects: 'app.projects',
          assetManagement: 'app.assetmanagement',
          pluginManagement: 'app.pluginmanagement',
          userManagement: 'app.usermanagement',
          user: 'app.userprofile'
        };
        const key = moduleTitles[Origin.location.module];
        if(key) this.data.breadcrumbs = [{ title: Origin.l10n.t(key) }];
      }
      const course = Origin.editor && Origin.editor.data && Origin.editor.data.course;

      Object.assign(this.data, {
        breadcrumbs: this.data.breadcrumbs.map(b => {
          if(b === 'dashboard') {
            return { title: Origin.l10n.t('app.dashboard'), url: '#' };
          }
          if(b === 'course') {
            return { title: course.get('title'), url: `#/editor/${course.get('_id')}/menu` };
          }
          return b;
        })
      });
      const courseTitle = course && course.get('title');
      if(this.data.showCourseTitle === true && courseTitle && courseTitle !== this.data.title) {
        this.data.course = { title: course.get('title') };
      } else {
        delete this.data.course;
      }
      return this.data;
    }
    setTitle(data) {
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
