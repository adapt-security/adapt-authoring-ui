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
        const courseId = Origin.location.route1;

        if (!courseId) return;

        this.content.customQuery.$or = [
          {_courseId: courseId}
        ];

        await this.content.fetch();
        var eventData = Helpers.parseLocationData();
        if(eventData.type === 'page') {
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
          buttonText: Origin.l10n.t('app.managetheme'),
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
          buttonIcon: 'fa-puzzle-piece',
          eventData: 'extensions'
        }
      ].map(i => Object.assign(i, { buttonClass: i.eventData === Origin.location.route2 ? 'selected' : '' }))
    }]);

    Origin.on('links', data => {
      if(Origin.location.module !== 'editor') return;
      Origin.router.navigateTo(`editor/${Origin.editor.data.course.get('_courseId')}/${data}`);
    });

    var eventData = Helpers.parseLocationData();
    
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
      let model
      if (eventData.type === 'course') {
        model = Origin.editor.data.course
      } else {
        model = Origin.editor.data.get({ _friendlyId: eventData.id }) || Origin.editor.data.get({ _id: eventData.id })
      }
      if (!model) {
        Origin.Notify.alert({
          type:"error",
          text: Origin.l10n.t('app.datamissing', {id:eventData.id})
        })
      } else {
        Origin.contentPane.setView(EditorFormView, { model })
      }
      return;
    }

    Origin.trigger(`editor:${eventData.contentType}`, eventData);
  }

  Origin.on('editor:contentObject', async data => {
    let model
    if (data.id) {
      model = Origin.editor.data.get({ _friendlyId: data.id }) || Origin.editor.data.get({ _id: data.id })
    } else {
      model = Origin.editor.data.course;
    }
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
