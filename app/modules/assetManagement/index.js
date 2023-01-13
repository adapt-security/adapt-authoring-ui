// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var AssetManagementEditAssetView = require('./views/assetManagementEditAssetView');
  var AssetManagementView = require('./views/assetManagementView');
  var AssetModel = require('./models/assetModel');

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
    Origin.contentHeader.setButtons(Origin.contentHeader.BUTTON_TYPES.FILTERS, [
      {
        name: Origin.l10n.t('app.search'),
        items: [
          {
            id: 'search',
            type: 'search',
            placeholder: Origin.l10n.t('app.searchbyname')
          }
        ]
      },
      {
        id: 'type',
        name: Origin.l10n.t('app.type'),
        items: [
          {
            id: 'image',
            type: 'toggle',
            buttonText: Origin.l10n.t('app.filetypeimage'),
            checked: true
          },
          {
            id: 'video',
            type: 'toggle',
            buttonText: Origin.l10n.t('app.filetypevideo'),
            checked: true
          },
          {
            id: 'audio',
            type: 'toggle',
            buttonText: Origin.l10n.t('app.filetypeaudio'),
            checked: true
          },
          {
            id: 'other',
            type: 'toggle',
            buttonText: Origin.l10n.t('app.filetypeother'),
            checked: true
          }
        ]
      },
      {
        name: Origin.l10n.t('app.tags'),
        items: [
          {
            id: 'tags',
            type: 'tags'
          }
        ]
      }
    ]);
    Origin.contentHeader.setButtons(Origin.contentHeader.BUTTON_TYPES.ACTIONS, [{
      items: [{
        buttonText: Origin.l10n.t('app.uploadnewasset'),
        id: 'upload'
      }]
    }]);
    Origin.trigger('contentHeader:updateTitle', { breadcrumbs, title: Origin.l10n.t('app.manageallassets') });
    Origin.contentPane.setView(AssetManagementView, {}, { fullWidth: true });
    Origin.trigger('assetManagement:loaded');
  }

  async function loadEditAssetView(location) {
    const isNew = location === undefined;
    const model = new AssetModel({ _id: location });
    const title = Origin.l10n.t(isNew ? 'app.newasset' : 'app.editasset');
    Origin.trigger('contentHeader:updateTitle', { breadcrumbs, title });
    Origin.contentHeader.setButtons(Origin.contentHeader.BUTTON_TYPES.ACTIONS, Origin.contentHeader.ACTION_BUTTON_TEMPLATES.EDIT_FORM);
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
