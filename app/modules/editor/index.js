// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define([
  'core/origin',
  './global/editorDataLoader',
  './global/views/editorFormView',
  'core/models/contentModel',
  './contentObject/index',
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
    var eventData = parseLocationData();
    let actionButtons = [];

    if(eventData.action === 'edit') {
      actionButtons = Origin.contentHeader.ACTION_BUTTON_TEMPLATES.EDIT_FORM;
    }
    Origin.contentHeader.setButtons(Origin.contentHeader.BUTTON_TYPES.ACTIONS, [{ items: actionButtons }]);

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
});
