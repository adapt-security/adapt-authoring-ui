// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  const EditorComponentEditSidebarView = require('./views/editorComponentEditSidebarView');
  const EditorComponentEditView = require('./views/editorComponentEditView');
  const Helpers = require('../global/helpers');
  const Origin = require('core/origin');

  Origin.on('editor:component', async ({ id: _id }) => {
    let model;
    if(_id === 'new') {
      if(!Origin.editor.data.newcomponent) {
        Origin.Notify.alert({ 
          type: 'error', 
          text: 'Invalid data for new component',
          callback: () => Origin.router.navigateBack()
        });
        return;
      }
      model = Origin.editor.data.newcomponent;
    } else {
      model = Origin.editor.data.content.findWhere({ _id });
      Helpers.setPageTitle(model);
    }
    const form = await Origin.scaffold.buildForm({ model });
    Origin.sidebar.addView(new EditorComponentEditSidebarView({ model, form }).$el);
    Origin.contentPane.setView(EditorComponentEditView, { model, form });
  });
});
