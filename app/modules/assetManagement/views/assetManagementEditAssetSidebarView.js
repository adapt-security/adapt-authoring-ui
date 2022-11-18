// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var SidebarItemView = require('modules/sidebar/views/sidebarItemView');

  var AssetManagementEditAssetSidebarView = SidebarItemView.extend({
    events: {
      'click .asset-management-edit-sidebar-save-button': 'onSaveNewAssetClicked',
      'click .asset-management-edit-sidebar-cancel-button': 'onCancelNewAssetClicked'
    },

    onSaveNewAssetClicked: function() {
      this.updateButton('.asset-management-edit-sidebar-save-button', Origin.l10n.t('app.saving'));
      Origin.trigger('assetManagement:editAsset');
    },

    onCancelNewAssetClicked: function() {
      Origin.router.navigateTo('assetManagement');
    }
  }, {
    template: 'assetManagementEditAssetSidebar'
  });

  return AssetManagementEditAssetSidebarView;
});
