// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var EditorArticleEditSidebarView = require('./views/editorArticleEditSidebarView');
  var EditorArticleEditView = require('./views/editorArticleEditView');
  var Helpers = require('../global/helpers');
  var Origin = require('core/origin');

  Origin.on('editor:article', async function(data) {
    if(data.action !== 'edit') {
      return;
    }
    var model = Origin.editor.data.content.findWhere({ _id: data.id });
    var form = await Origin.scaffold.buildForm({ model });
    Helpers.setPageTitle(model);
    Origin.sidebar.addView(new EditorArticleEditSidebarView({ model, form }).$el);
    Origin.contentPane.setView(EditorArticleEditView, { model, form });
  });
});
