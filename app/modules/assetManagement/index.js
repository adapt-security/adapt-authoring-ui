// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var ApiModel = require('core/models/apiModel');
  var AssetManagementEditAssetView = require('./views/assetManagementEditAssetView');
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
    Origin.assetManagement = {
      filterData: {}
    };
    if(!location) return loadAssetsView();
    loadEditAssetView(subLocation === 'edit' ? location : undefined);
  });

  function loadAssetsView() {
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
  }

  async function loadEditAssetView(location) {
    const isNew = location === undefined;
    const model = ApiModel.Asset({ _id: location });
    const title = Origin.l10n.t(isNew ? 'app.newasset' : 'app.editasset');
    Origin.contentHeader.setTitle({ breadcrumbs, title });
    Origin.contentHeader.setButtons(Origin.contentHeader.BUTTON_TYPES.ACTIONS, Origin.contentHeader.ACTION_BUTTON_TEMPLATES.EDIT_FORM);
    if(!isNew) {
      try {
        await model.fetch();
      } catch(e) {
        Origin.Notify.toast({ type: 'error', text: e.responseJSON.message });
      }
    }
    Origin.contentPane.setView(AssetManagementEditAssetView, { model });
  }
});
