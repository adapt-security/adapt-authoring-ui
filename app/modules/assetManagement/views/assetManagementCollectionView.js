// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var ApiCollection = require('core/collections/apiCollection');
  var ApiModel = require('core/models/apiModel');
  var AssetItemView = require('./assetManagementItemView');
  var AssetForm = require('./assetForm');
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');

  var AssetCollectionView = OriginView.extend({
    className: "asset-management-collection",

    sort: { createdAt: -1 },
    search: undefined,
    filters: [],
    tags: [],
    fetchCount: 0,
    shouldStopFetches: false,
    page: 1,
    pageSize: 1,
    assets: [],

    isModal: function() {
      return this.$el && this.$el.parents('.modal').length > 0;
    },

    getSelected: function() {
      return this.assets.findWhere({ _isSelected: true });
    },

    preRender: function(options) {
      this.initEventListeners();

      if(options.types) {
        this.filters = options.types;
      }
      this.assets = ApiCollection.Assets();
      this.tags = ApiCollection.Tags();

      this._doLazyScroll = _.bind(_.throttle(this.doLazyScroll, 250), this);
      this._onResize = _.bind(_.debounce(this.onResize, 400), this);
    },

    postRender: function() {
      this.initPaging();
      $('.asset-management-assets-container').on('scroll', this._doLazyScroll);
      $(window).on('resize', this._onResize);
    },

    initEventListeners: function() {
      this.listenTo(Origin, {
        'actions:upload modal:actions:upload assetManagement:edit': this.renderAssetForm,
        'filters modal:filters': this.filter,
        'assetManagement:collection:refresh': this.resetCollection,
        'assetForm:close': this.onFormClose
      });
    },

    initPaging: function() {
      var $item = new AssetItemView({ model: ApiModel.Asset() }).$el;
      var containerHeight = $('.asset-management-assets-container').outerHeight();
      var itemHeight = $item.outerHeight(true);
      var columns = Math.floor($('.asset-management-assets-container').outerWidth()/$item.outerWidth(true));
      var rows = Math.floor(containerHeight/itemHeight);
      // columns stack nicely, but need to add extra row if it's not a clean split
      if((containerHeight % itemHeight) > 0) rows++;
      this.pageSize = columns*rows;
      this.resetCollection(this.setViewToReady);
    },

    renderAssetForm: async function(model) {
      if(!this.form) this.form = new AssetForm({ model, $container: this.$('.asset-management-form') });
    },

    onFormClose: async function(error, model) {
      this.form = undefined;
      if(error) {
        return Origin.Notify[this.isModal() ? 'alert' : 'toast']({ type: 'error', text: error.message });
      }
      this.resetCollection();
      Origin.once('assetManagement:assetManagementCollection:fetched', () => {
        this.$(`.asset-management-list-item.id-${model.get('_id')}`).trigger('click');
      });
    },
    
    appendAssetItem: function (asset) {
      if(!asset) {
        return;
      }
      const tagsMapped = [];
      const assetTags = asset.get('tags');
      if(assetTags) {
        assetTags.forEach(tId => {
          tagsMapped.push(this.tags.find(t => t.get('_id') === tId).attributes);
        });
        asset.set('tagsMapped', tagsMapped);
      }
      this.$('.asset-management-collection-inner').append(new AssetItemView({ model: asset }).$el);
    },

    // Collection manipulation

    fetchCollection: async function(cb) {
      if(this.shouldStopFetches || this.isCollectionFetching) {
        return;
      }
      this.isCollectionFetching = true;

      Object.assign(this.assets.queryOptions, {
        skip: this.allAssets.length,
        limit: this.pageSize,
        page: this.page+1,
        sort: this.sort
      });
      await this.tags.fetch();
      
      this.assets.fetch({
        success: _.bind(function(collection, response) {
          this.allAssets.push(...collection.models);
          this.isCollectionFetching = false;
          // stop further fetching if this is the last page
          if(response.length < this.pageSize) this.shouldStopFetches = true;
          
          $('.asset-management-no-assets').toggleClass('display-none', this.allAssets.length > 0);
          
          this.$('.asset-management-list-item').remove();
          this.allAssets.forEach(a => this.appendAssetItem(a));
          
          this.isCollectionFetching = false;

          Origin.trigger('assetManagement:assetManagementCollection:fetched');
          if(typeof cb === 'function') cb(collection);
        }, this),
        error: function(error) {
          this.isCollectionFetching = false;
        }
      });
    },

    resetCollection: function(cb, shouldFetch = true, selectedId) {
      // to remove old views
      Origin.trigger('assetManagement:assetViews:remove');

      this.allAssets = [];
      this.shouldStopFetches = false;
      this.fetchCount = 0;
      this.page = 0;
      this.assets.reset();

      if(!shouldFetch) {
        return;
      }
      this.fetchCollection(() => {
        if(selectedId) Origin.trigger('assetManagement:assetItemView:preview', this.collection.findWhere({ _id: selectedId }));
        if(cb) cb()
      });
    },

    filter: function(filters) {
      const filterQuery = {};

      if(filters.pageSize) {
        this.model.set('pageSize', filters.pageSize);
      }
      if(filters.search) {
        const q = {  $regex: `.*${filters.search.toLowerCase()}.*`, $options: 'i' };
        filterQuery.$or = [{ title: q }, { description: q }];
      }
      if(filters.type) {
        filterQuery.type = { $in: Object.entries(filters.type).filter(([k,v]) => v).map(([k]) => k) };
      }
      if(filters.tags.length) {
        filterQuery.tags = { $all: filters.tags };
      }
      this.assets.customQuery = filterQuery;

      this.resetCollection(null, false);
      this.fetchCollection();
    },

    onResize: function() {
      this.initPaging();
    },

    doLazyScroll: function(e) {
      if(this.isCollectionFetching) {
        return;
      }
      const $last = $('.asset-management-list-item').last();
      const triggerY = ($('.asset-management').offset().top + this.$el.height()) - ($last.height()/2) ;

      if($last.offset().top < triggerY) this.fetchCollection();
    },

    remove: function() {
      $('.asset-management-assets-container').off('scroll', this._doLazyScroll);
      $(window).off('resize', this._onResize);

      OriginView.prototype.remove.apply(this, arguments);
    }

  }, {
    template: 'assetManagementCollection'
  });
  return AssetCollectionView;
});
