// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){

  var Backbone = require('backbone');
  var OriginView = require('core/views/originView');
  var Origin = require('core/origin');

  var AssetManagementPreviewView = OriginView.extend({

    tagName: 'div',

    className: 'asset-management-preview',

    events: {
      'click a.confirm-select-asset' : 'selectAsset',
      'click .asset-preview-edit-button': 'onEditButtonClicked',
      'click .asset-preview-delete-button': 'onDeleteButtonClicked'
    },

    preRender: function() {
      this.listenTo(this, 'remove', this.remove);
    },

    selectAsset: function (event) {
      event && event.preventDefault();

      var data = {eventToTrigger: 'assetModal:assetSelected', model: this.model};
      Origin.trigger('modal:passThrough', data);
    },

    onEditButtonClicked: function(event) {
      event.preventDefault();
      var assetId = this.model.get('_id');
      Origin.router.navigateTo(`assetManagement/${assetId}/edit`);
    },

    onDeleteButtonClicked: function(event) {
      event.preventDefault();

      Origin.Notify.confirm({
        type: 'warning',
        text: Origin.l10n.t('app.assetconfirmdelete'),
        callback: _.bind(this.onDeleteConfirmed, this)
      });
    },

    onDeleteConfirmed: async function(result) {
      if (!result.isConfirmed) {
        return;
      }
      try {
        await $.ajax({ url: `api/assets/${this.model.get('_id')}`, type: 'DELETE' });
        this.model.trigger('destroy', this.model, this.model.collection);
        Origin.trigger('assetManagement:assetPreviewView:delete');
        this.remove();
      } catch(e) {
        Origin.Notify.alert({
          type: 'error',
          text: Origin.l10n.t('app.errordeleteasset', { message: e.responseJSON && e.responseJSON.message || e.responseText })
        });
      }
    }
  }, {
    template: 'assetManagementPreview'
  });

  return AssetManagementPreviewView;

});
