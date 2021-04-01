// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var OriginView = require('core/views/originView');
  var Origin = require('core/origin');

  var AssetItemView = OriginView.extend({
    tagName: 'div',

    className: function() {
      return `asset-management-list-item id-${this.model.get('_id')}`;
    },

    events: {
      'click' : 'onAssetClicked'
    },

    preRender: function() {
      this.listenTo(this, 'remove', this.remove);
      this.listenTo(Origin, {
        'assetManagement:modal:selectItem': this.onAssetClicked,
        'assetManagement:assetViews:remove': this.remove
      });
      this.listenTo(this.model, {
        'destroy': this.remove,
        'change:_isDeleted': this.render
      });
    },
    
    postRender: function() {
      console.log(this.model.get('title'), this.model.get('_isSelected'));
      this.$el.toggleClass('selected', !!this.model.get('_isSelected'));
      if (this.model.get('_isSelected')) {
        Origin.trigger('assetManagement:assetItemView:preview', this.model);
      }
    },
    
    onAssetClicked: function (model) {
      if(model instanceof $.Event) {
        this.model.set('_isSelected', true);
        Origin.trigger('assetManagement:modal:selectItem', this.model);
      } else if(model.get('_id') !== this.model.get('_id')) {
        this.model.set('_isSelected', false);
      }
      this.render();
    }
  }, {
    template: 'assetManagementListItem'
  });

  return AssetItemView;
});
