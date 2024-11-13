// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define([
  'core/origin',
  './global/helpers',
  './global/views/editorView',
  './global/views/editorFormView',
  'core/collections/apiCollection',
  'core/collections/contentCollection',
  'core/models/contentModel',
  './language/index',
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

      async selectLanguage(lang) {
        this._selectedLanguage = lang;
        await Origin.editor.data.load();
        onRoute();
      },

      store(content) {
        content?.forEach(model => {
          const old = this.content.findWhere({_id: model._id})
          this.content.remove(old)
          this.content.add(model)
        })
      },

      async getPage(_friendlyId) {
        const courseId = Origin.location.route1;
        const model = this.content.findWhere({_friendlyId})
        const lastUpdate = model?.get('_type') === 'page' ? model.get('_subtreeUpdateTime') : 0
        try {
          /* const content =  */return $.get('api/content/page', {
            _courseId: courseId,
            _friendlyId,
            _lang: this._selectedLanguage,
            _subtreeUpdateTime: lastUpdate
          })
          //this.store(content)
        } catch (e) {}
      },

      async getStructure() {
        // if we have course then we have already loaded the structure
        // any change to page/menu models will cause course timestamp to change
        const courseId = Origin.location.route1;

        if (this.course?.get('_courseId') === courseId) {
          this._selectedLanguage = this._selectedLanguage || this._defaultLanguage
          // if the user has changed language then clear the content
          if (this.course?.get('_lang') !== this._selectedLanguage) {
            this.content.reset()
          }
        } else {
          // if a different course has been opened use its default language
          //this._selectedLanguage = this._defaultLanguage;
          this.content.reset()
        }

        const lastUpdate = this.course?.get('_subtreeUpdateTime')
        const { structure, langInfo, components } = await $.get('api/content/structure', {
          _courseId: courseId,
          _lang: this._selectedLanguage,
          _subtreeUpdateTime: lastUpdate
        })

        this.components.reset(components)

        this._languages = langInfo.languages?.sort((a, b) => a.localeCompare(b, 'en', {'sensitivity': 'base'}));
        this._defaultLanguage = langInfo.defaultLanguage;

        this._selectedLanguage = this._selectedLanguage || this._defaultLanguage
       
        structure?.forEach(model => {
          const existing = this.content.findWhere({_id: model._id})

          if (model._type === 'course' || model._type === 'config') {
            this.content.remove(existing)
            this.content.add(model)
            return
          }
          if (!existing) {
            // ensure content will be loaded when accessed
            model._subtreeUpdateTime = 0
            this.content.add(model)
            return
          }
          if (model._subtreeUpdateTime > existing.get('_subtreeUpdateTime')) {
            // ensure content will be loaded when accessed
            model._subtreeUpdateTime = 0
            this.content.remove(existing)
            this.content.add(model)
          }
        })
      },

      async getStructureAndPage(_friendlyId) {
        const [_, pageData] = await Promise.all([this.getStructure(), this.getPage(_friendlyId)])

        if (!pageData.length) return
        
        const { _friendlyId: pageId } = pageData.find(item => item._type === 'page')

        const existingPage = this.content.filter(model => {
          return (
            model.get('_friendlyId') === pageId ||
            model.get('_ancestors')?.includes(pageId)
          )
        })

        this.content.remove(existingPage)
        this.content.add(pageData)
      },

      async load() {
        const courseId = Origin.location.route1;

        if (!courseId) return;

        Origin.trigger('origin:showLoadingSubtle');

        const route = Origin.location.route2
        const specialRoutes = [
          'component',
          'config',
          'extensions',
          'languages',
          'menusettings',
          'selecttheme',
          'settings'
        ]

        // TODO: fix: if using direct URL this will break
        //const isMenu = route === 'menu' || !!this.content.findWhere({_friendlyId: route, _type:'menu'})

        /* if (isMenu || specialRoutes.includes(route)) {
          await this.getStructure()
        } else { */
          await this.getStructureAndPage(Origin.location.route2)
        /* } */

        Origin.trigger('editorData:loaded');
        Origin.trigger('origin:hideLoadingSubtle');
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
        },
        {
          buttonText: Origin.l10n.t('app.managelanguages'),
          buttonIcon: 'fa-language',
          eventData: 'languages'
        }
      ].map(i => Object.assign(i, { buttonClass: i.eventData === Origin.location.route2 ? 'selected' : '' }))
    }]);
    
    Origin.contentHeader.setLanguages(Origin.editor.data._languages, Origin.editor.data._selectedLanguage);

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
          text: Origin.l10n.t('app.datamissing', {id:eventData.id, lang:Origin.editor.data._selectedLanguage})
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
    Origin.contentHeader.setLanguages(Origin.editor.data._languages, Origin.editor.data._selectedLanguage);
    Origin.contentPane.setView(EditorView, {
      currentCourseId: Origin.location.route1,
      currentView: data.type,
      currentPageId: data.id,
      model
    }, { fullWidth: data.type === 'menu' });
  });
});
