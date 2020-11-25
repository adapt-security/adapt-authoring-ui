// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var EditorMenuSettingsEditSidebarView = require('./views/editorMenuSettingsEditSidebarView');
  var EditorMenuSettingsEditView = require('./views/editorMenuSettingsEditView');
  var Helpers = require('../global/helpers');
  var Origin = require('core/origin');

  Origin.on('editor:menusettings', function(data) {
    var route1 = Origin.location.route1;
    var model = Origin.editor.data.config;
    
    Helpers.setPageTitle(model);
    
    var backButtonRoute = `#/editor/${route1}/menu`;
    var backButtonText = Origin.l10n.t('app.backtomenu');
    
    if (Origin.previousLocation.route2 === "page") {
      backButtonRoute = `#/editor/${route1}/page/${Origin.previousLocation.route3}`;
      backButtonText = Origin.l10n.t('app.backtopage');
    }
    Origin.sidebar.addView(new EditorMenuSettingsEditSidebarView().$el, {
      backButtonText,
      backButtonRoute
    });
    Origin.contentPane.setView(EditorMenuSettingsEditView, { model });
  });
});
