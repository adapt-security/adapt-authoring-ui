// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var EditorConfigEditSidebarView = require('./views/editorConfigEditSidebarView');
  var EditorConfigEditView = require('./views/editorConfigEditView');
  var Helpers = require('../global/helpers');
  var Origin = require('core/origin');

  Origin.on('editor:config', async function(data) {
    var model = Origin.editor.data.config;
    var form = await Origin.scaffold.buildForm({ model });
    Helpers.setPageTitle(model);
    Origin.sidebar.addView(new EditorConfigEditSidebarView({ form }).$el);
    Origin.contentPane.setView(EditorConfigEditView, { model, form });
  });
});
