// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var PluginManagementView = require('./views/pluginManagementView');
  var PluginManagementUploadView = require('./views/pluginManagementUploadView');

  var scopes = ["write:contentplugins"];
  var breadcrumbs = [{ title: Origin.l10n.t('app.pluginmanagement'), url: 'pluginManagement' }];
  
  Origin.on('router:initialize', () => Origin.router.restrictRoute('pluginManagement', scopes));

  Origin.on('origin:dataReady', () => {
    Origin.globalMenu.addItem({
      location: 'global',
      text: Origin.l10n.t('app.pluginmanagement'),
      icon: 'fa-plug',
      route: 'pluginManagement',
      sortOrder: 3,
      scopes
    });
  });

  Origin.on('router:pluginManagement', function(location, subLocation, action) {
    if ('upload' === location) {
      Origin.trigger('contentHeader:updateTitle', { breadcrumbs, title: Origin.l10n.t('app.uploadplugin') });
      Origin.contentHeader.setButtons(Origin.contentHeader.BUTTON_TYPES.ACTIONS, Origin.contentHeader.ACTION_BUTTON_TEMPLATES.EDIT_FORM);
      Origin.contentPane.setView(PluginManagementUploadView);
    } else {
      Origin.contentHeader.setButtons(Origin.contentHeader.BUTTON_TYPES.FILTERS, [
        {
          items: [
            {
              type: 'toggle',
              buttonText: Origin.l10n.t('app.components'),
              checked: true,
              eventName: 'type:components'
            },
            {
              type: 'toggle',
              buttonText: Origin.l10n.t('app.extensions'),
              checked: true,
              eventName: 'type:extensions'
            },
            {
              type: 'toggle',
              buttonText: Origin.l10n.t('app.menus'),
              checked: true,
              eventName: 'type:menus'
            },
            {
              type: 'toggle',
              buttonText: Origin.l10n.t('app.themes'),
              checked: true,
              eventName: 'type:themes'
            }
          ]
        }
      ]);
      Origin.contentHeader.setButtons(Origin.contentHeader.BUTTON_TYPES.ACTIONS, [
        {
          buttonText: Origin.l10n.t('app.uploadplugin'),
          eventName: 'upload'
        },
        {
          buttonText: Origin.l10n.t('app.getnewplugins'),
          eventName: 'getnewplugins',
          buttonClass: 'action-secondary'
        }
      ]);
      Origin.trigger('contentHeader:updateTitle', { breadcrumbs, title: Origin.l10n.t('app.managepluginstitle') });
      Origin.trigger('sidebar:sidebarContainer:hide');

      Origin.contentPane.setView(PluginManagementView, { pluginType: location });

      Origin.on('actions:upload', function () {
        Origin.router.navigateTo('pluginManagement/upload');
      });
      Origin.on('actions:getnewplugins', function () {
        window.open('https://www.adaptlearning.org/index.php/plugin-browser/');
      });
    }
  });
});
