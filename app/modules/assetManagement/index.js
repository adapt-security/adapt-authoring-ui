// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var AssetCollection = require('./collections/assetCollection');
  var AssetManagementEditAssetView = require('./views/assetManagementEditAssetView');
  var AssetManagementView = require('./views/assetManagementView');
  var AssetModel = require('./models/assetModel');
  var TagsCollection = require('core/collections/tagsCollection');

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
    (new TagsCollection()).fetch({
      success: function(tagsCollection) {
        // Load asset collection before so sidebarView has access to it
        var assetCollection = new AssetCollection();
        // No need to fetch as the collectionView takes care of this
        // Mainly due to serverside filtering
        Origin.contentHeader.setButtons(Origin.contentHeader.BUTTON_TYPES.FILTERS, [
          {
            items: [
              {
                type: 'toggle',
                buttonText: Origin.l10n.t('app.filetypeimage'),
                checked: true,
                eventName: 'image'
              },
              {
                type: 'toggle',
                buttonText: Origin.l10n.t('app.filetypevideo'),
                checked: true,
                eventName: 'video'
              },
              {
                type: 'toggle',
                buttonText: Origin.l10n.t('app.filetypeaudio'),
                checked: true,
                eventName: 'audio'
              },
              {
                type: 'toggle',
                buttonText: Origin.l10n.t('app.filetypeother'),
                checked: true,
                eventName: 'other'
              },
              {
                type: 'search',
                buttonText: Origin.l10n.t('app.search'),
                placeholder: Origin.l10n.t('app.searchbyname'),
                eventName: 'search'
              },
              {
                type: 'tags',
                buttonText: Origin.l10n.t('app.tags'),
                eventName: 'tags'
              }
            ]
          }
        ]);
        Origin.contentHeader.setButtons(Origin.contentHeader.BUTTON_TYPES.ACTIONS, [
          {
            buttonText: Origin.l10n.t('app.uploadnewasset'),
            eventName: 'upload'
          }
        ]);
        Origin.trigger('contentHeader:updateTitle', { breadcrumbs, title: Origin.l10n.t('app.manageallassets') });
        Origin.trigger('sidebar:sidebarContainer:hide');
        Origin.contentPane.setView(AssetManagementView, { collection: assetCollection });
        Origin.trigger('assetManagement:loaded');

        Origin.on('actions:upload', () => Origin.router.navigateTo('assetManagement/upload'));
      },
      error: function() {
        console.log('Error occured getting the tags collection - try refreshing your page');
      }
    });
  }

  async function loadEditAssetView(location) {
    const isNew = location === undefined;
    const model = new AssetModel({ _id: location });
    const title = Origin.l10n.t(isNew ? 'app.newasset' : 'app.editasset');
    Origin.trigger('contentHeader:updateTitle', { breadcrumbs, title });
    Origin.contentHeader.setButtons(Origin.contentHeader.BUTTON_TYPES.ACTIONS, Origin.contentHeader.ACTION_BUTTON_TEMPLATES.EDIT_FORM);
    Origin.trigger('sidebar:sidebarContainer:hide');
    if(!isNew) {
      try {
        await model.fetch();
      } catch(e) {
        Origin.Notify.alert({ type: 'error', text: e.responseJSON.message });
      }
    }
    Origin.contentPane.setView(AssetManagementEditAssetView, { model });
  }
});
