// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');
  var assetManagementModalEditAssetView = require('modules/assetManagement/views/assetManagementModalEditAssetView');

  var assetManagementModalEditAssetView = OriginView.extend({
    className: 'asset-management-modal-new-asset',

    events: {
      'click .asset-management-modal-edit-asset-save': 'onSaveClicked',
      'click .asset-management-modal-edit-asset-cancel': 'onCancelClicked'
    },

    postRender: function() {
      this.childView = new AssetManagementNewAssetView({ model: this.model });
      this.childView.onSaveSuccess = () => {
        Origin.trigger('assetManagement:collection:refresh');
        this.remove();
      };
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

  return assetManagementModalEditAssetView;
});
