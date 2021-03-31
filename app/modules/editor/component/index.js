// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  const EditorComponentEditSidebarView = require('./views/editorComponentEditSidebarView');
  const EditorComponentEditView = require('./views/editorComponentEditView');
  const Helpers = require('../global/helpers');
  const Origin = require('core/origin');

  Origin.on('editor:component', async ({ id: _id }) => {
    if(_id === 'new' && !Origin.editor.data.newcomponent) {
      return Origin.Notify.alert({ 
        type: 'error', 
        text: 'Invalid data for new component',
        callback: () => Origin.router.navigateBack()
      });
    }
    const model = _id === 'new' ? Origin.editor.data.newcomponent : Origin.editor.data.content.findWhere({ _id });
    const form = await Origin.scaffold.buildForm({ model });
    Helpers.setPageTitle(model);
    Origin.sidebar.addView(new EditorComponentEditSidebarView({ model, form }).$el);
    Origin.contentPane.setView(EditorComponentEditView, { model, form });
  });
});
