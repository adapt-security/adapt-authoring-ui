// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define([
  'core/origin',
  './global/editorDataLoader',
  './form/views/editorFormView',
  'core/models/contentModel',
  './contentObject/index',
  './course/index',
  './extensions/index',
  './menuSettings/index',
  './themeEditor/index'
], function(Origin, EditorData, EditorFormView, ContentModel) {
  // loads editor data
  Origin.on('router:editor editor:refreshData', EditorData.load);
  Origin.on('router', mod => {
    if(mod !== 'editor') EditorData.resetCourseData();
  });
  // handle routing
  Origin.on('router:editor', () => EditorData.waitForLoad(triggerEvent));
  /**
  * Acts as a sub-router to send out more useful events
  */
  function triggerEvent() {
    var route2 = Origin.location.route2;
    var type;
    switch(route2) {
      case 'article':
      case 'block':
      case 'component':
      case 'config':
      case 'extensions':
      case 'menusettings':
      case 'selecttheme':
        type = route2;
        break;
      case 'page':
      case 'menu':
        type = 'contentObject';
        break;
      case 'settings':
        type = 'course';
        break;
    }

    let actionButtons = [];

    if(type === 'contentObject') {
      actionButtons = [
        {
          buttonText: Origin.l10n.t('app.preview'),
          eventName: 'preview'
        },
        {
          buttonText: Origin.l10n.t('app.download'),
          buttonClass: 'action-secondary',
          eventName: 'publish'
        }
      ];
      if(Origin.sessionModel.hasScopes(["export:adapt"])) {
        actionButtons.push({
          buttonText: Origin.l10n.t('app.export'),
          buttonClass: 'action-secondary',
          eventName: 'export'
        });
      }
    } else {
      actionButtons = Origin.contentHeader.ACTION_BUTTON_TEMPLATES.EDIT_FORM;
    }
    Origin.contentHeader.setButtons(Origin.contentHeader.BUTTON_TYPES.ACTIONS, [{ items: actionButtons }]);

    if(Origin.location.route4 === 'edit') {
      new ContentModel({ _id: Origin.location.route3 }).fetch({
        success: model => Origin.contentPane.setView(EditorFormView, { model }), 
        error: e => Origin.Notify.alert()
      });
      return;
    }

    Origin.trigger(`editor:${type}`, {
      type: route2,
      id: Origin.location.route3,
      action: Origin.location.route4
    });
  }
});
