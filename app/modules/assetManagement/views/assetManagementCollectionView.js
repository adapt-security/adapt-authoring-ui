// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');
  var AssetItemView = require('./assetManagementItemView');
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

      this.tagsCollection = new TagsCollection();

      this._doLazyScroll = _.bind(_.throttle(this.doLazyScroll, 250), this);
      this._onResize = _.bind(_.debounce(this.onResize, 400), this);
    },

    postRender: function() {
      if(this.isModal) {
        this.initPaging();
      } else {
        Origin.on('contentPane:ready', () => this.initPaging());
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
        'assetManagement:collection:refresh': this.resetCollection
      });
    },

    initPaging: function() {
      this.resetCollection(_.bind(function(collection) {
        collection.forEach(this.appendAssetItem);
        var containerHeight = $('.asset-management-assets-container').outerHeight();
        var containerWidth = $('.asset-management-assets-container').outerWidth();
        var itemHeight = $('.asset-management-list-item').outerHeight(true);
        var itemWidth = $('.asset-management-list-item').outerWidth(true);
        var columns = Math.floor(containerWidth/itemWidth);
        var rows = Math.floor(containerHeight/itemHeight);
        // columns stack nicely, but need to add extra row if it's not a clean split
        if((containerHeight % itemHeight) > 0) rows++;
        this.pageSize = columns*rows;
        // need another reset to get the actual pageSize number of items
        this.resetCollection(this.setViewToReady);
      }, this));
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
      Object.assign(this.collection.options, {
        skip: this.allAssets.length,
        limit: this.pageSize,
        page: this.page++,
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

    resetCollection: function(cb, shouldFetch = true) {
      // to remove old views
      Origin.trigger('assetManagement:assetViews:remove');

      this.allAssets = [];
      this.shouldStopFetches = false;
      this.fetchCount = 0;
      this.page = 0;
      this.collection.reset();

      if(shouldFetch) this.fetchCollection(cb);
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
      $(window).on('resize', this._onResize);

      OriginView.prototype.remove.apply(this, arguments);
    }

  }, {
    template: 'assetManagementCollection'
  });
  return AssetCollectionView;
});
