// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');
  var assetManagementEditAssetView = require('modules/assetManagement/views/assetManagementEditAssetView');

  var assetManagementModalEditAssetView = OriginView.extend({
    className: 'asset-management-modal-new-asset',

    events: {
      'click .asset-management-modal-edit-asset-save': 'onSaveClicked',
      'click .asset-management-modal-edit-asset-cancel': 'onCancelClicked'
    },

    postRender: function() {
      Origin.once('assetManagement:modalEdit:remove', this.remove.bind(this));

      this.childView = new assetManagementEditAssetView({ 
        model: this.model.set('isModal', true) 
      });
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
    template: 'assetManagementModalEditAsset'
  });

  return assetManagementModalEditAssetView;
});
