// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');
  var AssetManagementCollectionView = require('./assetManagementCollectionView');
  var AssetManagementPreviewView = require('./assetManagementPreviewView');

  var AssetManagementView = OriginView.extend({
    tagName: 'div',
    className: 'asset-management',

    preRender: function() {
      this.listenTo(Origin, {
        'assetManagement:assetItemView:preview': this.onAssetClicked,
        'assetManagement:assetPreviewView:delete': this.onAssetDeleted
      });
    },

    postRender: function() {
      this.collectionView = new AssetManagementCollectionView({ collection: this.collection });
      this.$('.asset-management-assets-container-inner').append(this.collectionView.$el);
      // defer setting ready status until images are ready
      _.defer(() => this.collectionView.$el.imageready(this.setViewToReady.bind(this)));
    },

    onAssetClicked: function(model) {
      this.$('.asset-management-no-preview').hide();

      var view = new AssetManagementPreviewView({ model: model });
      this.$('.asset-management-preview-container-inner').html(view.$el);
    },

    onAssetDeleted: function() {
      this.$('.asset-management-no-preview').show();
    }
  }, {
    template: 'assetManagement'
  });

  // TODO specified here for the modal view, this needs doing better
  AssetManagementView.contentHeaderButtons = {
    filters: [
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
    ]
  };

  return AssetManagementView;
});
