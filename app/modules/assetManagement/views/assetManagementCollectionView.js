// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');
  var AssetItemView = require('./assetManagementItemView');
  var AssetModel = require('../models/assetModel');
  var TagsCollection = require('core/collections/tagsCollection');

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

    preRender: function(options) {
      this.initEventListeners();

      this.isModal = options.isModal || false;

      if(options.types) {
        this.filters = options.types;
      }
      this.tagsCollection = new TagsCollection();

      this._doLazyScroll = _.bind(_.throttle(this.doLazyScroll, 250), this);
      this._onResize = _.bind(_.debounce(this.onResize, 400), this);
    },

    postRender: function() {
      if(this.isModal) {
        this.initPaging();
      } else {
        Origin.once('contentPane:ready', () => this.initPaging());
      }
      // init lazy scrolling
      $('.asset-management-assets-container').on('scroll', this._doLazyScroll);
      $(window).on('resize', this._onResize);
    },

    initEventListeners: function() {
      this.listenTo(Origin, {
        'assetManagement:sidebarFilter:add': this.addFilter,
        'assetManagement:sidebarFilter:remove': this.removeFilter,
        'assetManagement:sidebarView:filter': this.filterBySearchInput,
        'assetManagement:assetManagementSidebarView:filterByTags': this.filterByTags,
        'assetManagement:collection:refresh': this.resetCollection,
        'assetManagement:assetPreviewView:delete': this.onAssetDeleted
      });
    },

    initPaging: function() {
      var $item = new AssetItemView({ model: new AssetModel() }).$el;
      $item.css({
        visibility: 'hidden'
      }).appendTo('body');
      var containerHeight = $('.asset-management-assets-container').outerHeight();
      var itemHeight = $item.outerHeight(true);
      var columns = Math.floor($('.asset-management-assets-container').outerWidth()/$item.outerWidth(true));
      var rows = Math.max(1, Math.ceil(containerHeight/itemHeight));
      $item.remove();
      // columns stack nicely, but need to add extra row if it's not a clean split
      if((containerHeight % itemHeight) > 0) rows++;
      this.pageSize = columns*rows;
      this.resetCollection(this.setViewToReady);
    },

    appendAssetItem: function (asset) {
      if(!asset) {
        return;
      }
      const tagsMapped = [];
      const assetTags = asset.get('tags');
      if(assetTags) {
        assetTags.forEach(tId => {
          tagsMapped.push(this.tagsCollection.find(t => t.get('_id') === tId).attributes);
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

      this.collection.customQuery.tags = { $all: this.tags };

      if(this.search) {
        this.collection.customQuery.$or = [
          { title: {  $regex: `.*${this.search.toLowerCase()}.*`, $options: 'i' } },
          { description: {  $regex: `.*${this.search.toLowerCase()}.*`, $options: 'i' } }
        ]
      } else {
        delete this.collection.customQuery.$or;
      }
      if(this.filters.length) {
        this.collection.customQuery.type = { $in: this.filters };
      } else {
        delete this.collection.customQuery.type;
      }
      Object.assign(this.collection.queryOptions, {
        skip: this.allAssets.length,
        limit: this.pageSize,
        page: this.page+1,
        sort: this.sort
      });
      await this.tagsCollection.fetch();

      this.collection.fetch({
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
          console.log(error);
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
      this.collection.reset();

      if(!shouldFetch) {
        return;
      }
      this.fetchCollection(() => {
        if(selectedId) Origin.trigger('assetManagement:assetItemView:preview', this.collection.findWhere({ _id: selectedId }));
        if(cb) cb()
      });
    },

    // Filtering

    addFilter: function(filterType) {
      this.filters.push(filterType);
      this.resetCollection();
    },

    removeFilter: function(filterType) {
      // remove filter from this.filters
      this.filters = this.filters.filter(item => item !== filterType);
      this.resetCollection();
    },

    filterBySearchInput: function (filterText) {
      this.resetCollection(null, false);
      this.search = filterText;
      this.fetchCollection();

      $(".asset-management-modal-filter-search" ).focus();
    },

    filterByTags: function(tags) {
      this.resetCollection(null, false);
      this.tags = _.pluck(tags, 'id');
      this.fetchCollection();
    },

    onAssetDeleted: function(assetId) {
      if (!assetId) return;
      this.allAssets = this.allAssets.filter(asset => asset.get('_id') !== assetId);
      $('.asset-management-no-assets').toggleClass('display-none', this.allAssets.length > 0);
    },

    // Event handling

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
