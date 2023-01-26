// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var AssetManagementView = require('./views/assetManagementView');
  var Origin = require('core/origin');

  const scopes = ['write:assets'];
  const breadcrumbs = [{ title: Origin.l10n.t('app.assetmanagement'), url: 'assetManagement' }];

  Origin.on('router:initialize', () => Origin.router.restrictRoute('assetManagement', scopes));
  
  Origin.on('origin:dataReady', () => {
    Origin.globalMenu.addItem({
      "location": "global",
      "text": Origin.l10n.t('app.assetmanagement'),
      "icon": "fa-file-image-o",
      "route": "assetManagement",
      "sortOrder": 2,
      "scopes": scopes
    });
  });
  

  Origin.on('router:assetManagement', function(location, subLocation, action) {
    if(location) {
      return;
    }
    Origin.assetManagement = {
      filterData: {}
    };
    Object.entries(AssetManagementView.contentHeaderButtons).forEach(([type, groups]) => {
      Origin.contentHeader.setButtons(type, groups);
    });
    Origin.contentHeader.setButtons(Origin.contentHeader.BUTTON_TYPES.ACTIONS, [{
      items: [{
        buttonText: Origin.l10n.t('app.uploadnewasset'),
        id: 'upload'
      }]
    }]);
    Origin.contentHeader.setTitle({ breadcrumbs, title: Origin.l10n.t('app.manageallassets') });
    Origin.contentPane.setView(AssetManagementView, {}, { fullWidth: true });
  });
});
