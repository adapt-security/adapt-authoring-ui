// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var EditorBlockEditSidebarView = require('./views/editorBlockEditSidebarView');
  var EditorBlockEditView = require('./views/editorBlockEditView');
  var Helpers = require('../global/helpers');
  var Origin = require('core/origin');

  Origin.on('editor:block', async function(data) {
    if(data.action !== 'edit') {
      return;
    }
    var model = Origin.editor.data.content.findWhere({ _id: data.id });
    var form = await Origin.scaffold.buildForm({ model });
    Helpers.setPageTitle(model);
    Origin.sidebar.addView(new EditorBlockEditSidebarView({ model, form }).$el);
    Origin.contentPane.setView(EditorBlockEditView, { model, form });
  });
});
