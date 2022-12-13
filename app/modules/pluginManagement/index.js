// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var PluginManagementView = require('./views/pluginManagementView');
  var PluginManagementUploadView = require('./views/pluginManagementUploadView');
  var PluginManagementSidebarView = require('./views/pluginManagementSidebarView');
  var PluginManagementUploadSidebarView = require('./views/pluginManagementUploadSidebarView');

  var scopes = ["write:contentplugins"];
  
  Origin.on('router:initialize', () => Origin.router.restrictRoute('pluginManagement', scopes));

  Origin.globalMenu.addItem({
    location: 'global',
    text: Origin.l10n.t('app.pluginmanagement'),
    icon: 'fa-plug',
    route: 'pluginManagement',
    sortOrder: 3,
    scopes
  });

  Origin.on('router:pluginManagement', function(location, subLocation, action) {
    if (!location) {
      location = 'extension';
    }
    if ('upload' === location) {
      Origin.contentPane.setView(PluginManagementUploadView);
      Origin.sidebar.addView(new PluginManagementUploadSidebarView().$el, {});
    } else {
      Origin.contentPane.setView(PluginManagementView, { pluginType: location });
      Origin.sidebar.addView(new PluginManagementSidebarView().$el);
    }
  });
});
