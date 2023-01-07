// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var EditorMenuSettingsEditView = require('./views/editorMenuSettingsEditView');
  var Helpers = require('../global/helpers');
  var Origin = require('core/origin');

  Origin.on('editor:menusettings', function(data) {
    var model = Origin.editor.data.config;
    Helpers.setPageTitle(model);
    Origin.contentPane.setView(EditorMenuSettingsEditView, { model });
  });
});
