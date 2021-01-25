// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var OriginView = require('core/views/originView');
  var Origin = require('core/origin');

  var AssetItemView = OriginView.extend({
    tagName: 'div',

    className: function() {
      return [
        `asset-management-list-item`,
        `id-${this.model.get('_id')}`,
        this.model.get('_isSelected') ? 'selected' : ''
      ].join(' ');
    },

    events: {
      'click' : 'onAssetClicked'
    },

    preRender: function() {
      this.listenTo(this, 'remove', this.remove);
      this.listenTo(Origin, {
        'assetManagement:modal:selectItem': this.selectItem,
        'assetManagement:assetViews:remove': this.remove
      });
      this.listenTo(this.model, {
        'destroy': this.remove,
        'change:_isDeleted': this.render
      });
    },

    postRender: function() {
      if (this.model.get('_isSelected')) {
        Origin.trigger('assetManagement:assetItemView:preview', this.model);
      }
    },

    onAssetClicked: function () {
      console.log('onAssetClicked', this.model.get('_id'));
      this.model.set('_isSelected', true);
      this.render();
    },

    selectItem: function(modelId) {
      if (modelId === this.model.get('_id')) this.onAssetClicked();
    }
  }, {
    template: 'assetManagementListItem'
  });

  return AssetItemView;
});
