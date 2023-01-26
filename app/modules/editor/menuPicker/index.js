// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var EditorMenuSettingsEditView = require('./views/editorMenuSettingsView');
  var Helpers = require('../global/helpers');
  var Origin = require('core/origin');

  Origin.on('editor:menusettings', function(data) {
    var model = Origin.editor.data.config;
    Helpers.setPageTitle(model);
    Origin.contentHeader.setButtons(Origin.contentHeader.BUTTON_TYPES.ACTIONS, Origin.contentHeader.ACTION_BUTTON_TEMPLATES.EDIT_FORM);
    Origin.contentPane.setView(EditorMenuSettingsEditView, { model }, { fullWidth: true });
  });
});
