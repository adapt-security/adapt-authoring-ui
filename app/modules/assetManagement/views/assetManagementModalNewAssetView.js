// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var OriginView = require('core/views/originView');
  var AssetManagementNewAssetView = require('modules/assetManagement/views/assetManagementNewAssetView');

  var AssetManagementModalNewAssetView = OriginView.extend({
    className: 'asset-management-modal-new-asset',

    events: {
      'click .asset-management-modal-new-asset-save': 'onSaveClicked',
      'click .asset-management-modal-new-asset-cancel': 'onCancelClicked'
    },

    postRender: function() {
      this.childView = new AssetManagementNewAssetView({ model: this.model });
      $('.wrapper', this.$el).append(this.childView.$el);
    },

    onSaveClicked: function(event) {
      event.preventDefault();
      this.childView.save();
    },

    onCancelClicked: function(event) {
      event.preventDefault();
      this.remove();
    }
  }, {
    template: 'assetManagementModalNewAsset'
  });

  return AssetManagementModalNewAssetView;
});
