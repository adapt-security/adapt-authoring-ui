// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define([
  'core/origin',
  './global/helpers',
  './global/editorDataLoader',
  './global/views/editorView',
  './global/views/editorFormView',
  'core/models/contentModel',
  './manageExtensions/index',
  './menuPicker/index',
  './themeEditor/index'
], function(Origin, Helpers, EditorData, EditorView, EditorFormView, ContentModel) {
  // loads editor data
  Origin.on('router:editor editor:refreshData', EditorData.load);
  Origin.on('router', mod => {
    if(mod !== 'editor') EditorData.resetCourseData();
  });
  
  Origin.on('router:editor', onRoute);
  
  function onRoute() {
    EditorData.waitForLoad(() => {
      Origin.contentHeader.setButtons(Origin.contentHeader.BUTTON_TYPES.LINKS, [{ 
        items: [
          {
            buttonText: Origin.l10n.t('app.coursestructure'),
            buttonIcon: 'fa-birthday-cake',
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
            buttonIcon: 'fa-cubes',
            eventData: 'extensions'
          }
        ].map(i => Object.assign(i, { buttonClass: i.eventData === Origin.location.route2 ? 'selected' : '' }))
      }]);

      Origin.on('links', data => {
        if(Origin.location.module !== 'editor') return;
        Origin.router.navigateTo(`editor/${Origin.editor.data.course.get('_id')}/${data}`);
      });

      triggerEvent();
    });
  }

  function triggerEvent() {
    var eventData = parseLocationData();
    let actionButtons = [];

    Origin.contentHeader.setButtons(Origin.contentHeader.BUTTON_TYPES.ACTIONS, [{ items: actionButtons }]);

    if(eventData.action === 'new' && eventData.type === 'component') {
      Origin.contentPane.setView(EditorFormView, { model: Origin.editor.data.newcomponent });
      return;
    } 
    if(eventData.action === 'edit') {
      let model;
      if(eventData.contentType === 'config') {
        model = Origin.editor.data.config;
      } else if(eventData.contentType === 'course') {
        model = Origin.editor.data.course;
      } else {
        model = new ContentModel({ _id: eventData.id });
      }
      model.fetch({
        success: model => Origin.contentPane.setView(EditorFormView, { model }), 
        error: e => Origin.Notify.alert({ type: 'error', text: e.message })
      });
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
      data.action = 'edit';
    }
    return data;
  }

  Origin.on('editor:contentObject', data => {
    const model = data.id ? Origin.editor.data.content.findWhere({ _id: data.id }) : Origin.editor.data.course;
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
      currentPageId: data.id
    }, { fullWidth: data.type === 'menu' });
  });
});
