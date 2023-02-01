// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define([
  'core/origin',
  './global/helpers',
  './global/views/editorView',
  './global/views/editorFormView',
  'core/collections/apiCollection',
  'core/collections/contentCollection',
  'core/models/contentModel',
  './manageExtensions/index',
  './menuPicker/index',
  './themeEditor/index'
], function(Origin, Helpers, EditorView, EditorFormView, ApiCollection, ContentCollection, ContentModel) {
  /**
   * Global editor object
   */
  Origin.editor = {
    data: {
      components: ApiCollection.ContentPlugins({ customQuery: { type: 'component' } }),
      content: new ContentCollection(),
      get course() { return this.content.findWhere({ _type: 'course' }); },
      get config() { return this.content.findWhere({ _type: 'config' }); },
      get(attributes) { return this.content.findWhere(attributes) },

      async load() {
        this.content.customQuery._courseId = Origin.location.route1;
        await this.content.fetch();

        if(Origin.location.route2 === 'page') {
          await this.components.fetch();
        }
        Origin.trigger('editorData:loaded');
      },
      getParent(model) {
        return this.content.findWhere({ _id: typeof model === 'string' ? model : model.get('_parentId') });
      },
      getChildren(model) {
        const customQuery = { _parentId: typeof model === 'string' ? model : model.get('_id') };
        return new ContentCollection(this.content.where(customQuery), { customQuery });
      },
      getComponent(model) {
        return this.components.findWhere({ name: model.get('_component') } );
      }
    }
  };
  // load editor data before routing
  Origin.on('router:editor', async () => {
    await Origin.editor.data.load();
    onRoute();
  });

  function onRoute() {
    Origin.contentHeader.setButtons(Origin.contentHeader.BUTTON_TYPES.LINKS, [{ 
      items: [
        {
          buttonText: Origin.l10n.t('app.editormenu'),
          buttonIcon: 'fa-cubes',
          eventData: 'menu'
        },
        {
          buttonText: Origin.l10n.t('app.projectsettings'),
          buttonIcon: 'fa-folder-open',
          eventData: 'settings'
        },
        {
          buttonText: Origin.l10n.t('app.configurationsettings'),
          buttonIcon: 'fa-cog',
          eventData: 'config'
        },
        {
          buttonText: Origin.l10n.t('app.thememanagement'),
          buttonIcon: 'fa-paint-brush',
          eventData: 'selecttheme'
        },
        {
          buttonText: Origin.l10n.t('app.menupicker'),
          buttonIcon: 'fa-th-large',
          eventData: 'menusettings'
        },
        {
          buttonText: Origin.l10n.t('app.manageextensions'),
          buttonIcon: 'fa-puzzle-piece ',
          eventData: 'extensions'
        }
      ].map(i => Object.assign(i, { buttonClass: i.eventData === Origin.location.route2 ? 'selected' : '' }))
    }]);

    Origin.on('links', data => {
      if(Origin.location.module !== 'editor') return;
      Origin.router.navigateTo(`editor/${Origin.editor.data.course.get('_id')}/${data}`);
    });

    var eventData = parseLocationData();
    
    if(eventData.action === 'new' && eventData.type === 'component') {
      if(!Origin.editor.data.newcomponent) {
        Origin.Notify.toast({ type: 'error', text: Origin.l10n.t('app.componentdatamissing') });
        Origin.router.navigateBack();
        return;
      }
      const model = Origin.editor.data.newcomponent;
      model.parent = Origin.editor.data.get({ _id: model.get('_parentId') });
      Origin.contentPane.setView(EditorFormView, { model });
      delete Origin.editor.data.newcomponent;
      return;
    } 
    if(eventData.action === 'edit') {
      Origin.contentPane.setView(EditorFormView, { model: Origin.editor.data.get({ _id: eventData.id }) })
      return;
    }

    Origin.trigger(`editor:${eventData.contentType}`, eventData);
  }

  function parseLocationData() {
    var data = {
      contentType: Origin.location.route2,
      type: Origin.location.route2,
      id: Origin.location.route3,
      action: Origin.location.route4
    };
    if(data.type === 'page' || data.type === 'menu') {
      data.contentType = 'contentObject';
    }
    if(data.type === 'settings') {
      data.contentType = 'course';
    }
    if(data.contentType === 'config' || data.contentType === 'course') {
      data.id = data.contentType === 'course' ? Origin.location.route1 : Origin.editor.data.config.get('_id');
      data.action = 'edit';
    }
    return data;
  }

  Origin.on('editor:contentObject', async data => {
    const model = data.id ? Origin.editor.data.get({ _id: data.id }) : Origin.editor.data.course;
    
    Helpers.setPageTitle(model);

    const actionButtons = [
      {
        id: 'preview',
        buttonText: Origin.l10n.t('app.preview'),
      },
      {
        id: 'publish',
        buttonText: Origin.l10n.t('app.download'),
        buttonClass: 'action-secondary'
      }
    ];
    if(Origin.sessionModel.hasScopes(["export:adapt"])) {
      actionButtons.push({
        id: 'export',
        buttonText: Origin.l10n.t('app.export'),
        buttonClass: 'action-secondary'
      });
    }
    Origin.contentHeader.setButtons(Origin.contentHeader.BUTTON_TYPES.ACTIONS, [{ items: actionButtons }]);
    Origin.contentPane.setView(EditorView, {
      currentCourseId: Origin.location.route1,
      currentView: data.type,
      currentPageId: data.id,
      model
    }, { fullWidth: data.type === 'menu' });
  });
});
