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
      this.model.set({ iconName: this.getIconName() });
    },
    
    postRender: function() {
      this.$el.toggleClass('selected', !!this.model.get('_isSelected'));
      if (this.model.get('_isSelected')) {
        Origin.trigger('assetManagement:assetItemView:preview', this.model);
      }
    },

    getIconName: function() {
      const type = this.model.get('type');
      const subtype = this.model.get('subtype');

      switch(type) {
        case 'audio': return 'fa-file-audio-o';
        case 'image': return 'fa-file-image-o';
        case 'font': return 'fa-file-code-o';
        case 'video': return 'fa-file-video-o';
      }
      switch(subtype) {
        case 'pdf': return 'fa-file-pdf-o';
        case 'zip': return 'fa-file-zipper-o';
      }
      return 'fa-file-o';
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
