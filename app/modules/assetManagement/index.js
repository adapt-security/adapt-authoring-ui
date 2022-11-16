// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var AssetCollection = require('./collections/assetCollection');
  var AssetManagementEditAssetView = require('./views/assetManagementEditAssetView');
  var AssetManagementEditAssetSidebarView = require('./views/assetManagementEditAssetSidebarView');
  var AssetManagementSidebarView = require('./views/assetManagementSidebarView');
  var AssetManagementView = require('./views/assetManagementView');
  var AssetModel = require('./models/assetModel');
  var TagsCollection = require('core/collections/tagsCollection');

  Origin.on('origin:dataReady login:changed', function() {
    const permissions = ['write:assets'];

    Origin.router.restrictRoute('assetManagement', permissions);
    
  	if (!Origin.sessionModel.hasScopes(permissions)) {
      isReady = true;
      return;
    }
    Origin.globalMenu.addItem({
      "location": "global",
      "text": Origin.l10n.t('app.assetmanagement'),
      "icon": "fa-file-image-o",
      "callbackEvent": "assetManagement:open",
      "sortOrder": 2
    });
  });

  Origin.on('globalMenu:assetManagement:open', function() {
    Origin.router.navigateTo('assetManagement');
  });

  Origin.on('router:assetManagement', function(location, subLocation, action) {
    Origin.assetManagement = {
      filterData: {}
    };
    if(!location) return loadAssetsView();
    if(subLocation === 'edit') loadEditAssetView(location);
  });

  function loadAssetsView() {
    (new TagsCollection()).fetch({
      success: function(tagsCollection) {
        // Load asset collection before so sidebarView has access to it
        var assetCollection = new AssetCollection();
        // No need to fetch as the collectionView takes care of this
        // Mainly due to serverside filtering
        Origin.trigger('location:title:hide');
        Origin.sidebar.addView(new AssetManagementSidebarView({ collection: tagsCollection }).$el);
        Origin.contentPane.setView(AssetManagementView, { collection: assetCollection });
        Origin.trigger('assetManagement:loaded');
      },
      error: function() {
        console.log('Error occured getting the tags collection - try refreshing your page');
      }
    });
  }

  async function loadEditAssetView(location) {
    const isNew = location !== undefined;
    const model = new AssetModel({ _id: location });
    const title = Origin.l10n.t(isNew ? 'app.newasset' : 'app.editasset');
    Origin.trigger('location:title:update', { title });
    if(!isNew) {
      try {
        await model.fetch();
      } catch(e) {
        Origin.Notify.alert({ type: 'error', text: e.responseJSON.message });
      }
    }
    Origin.sidebar.addView(new AssetManagementEditAssetSidebarView().$el);
    Origin.contentPane.setView(AssetManagementEditAssetView, { model });
  }
});
