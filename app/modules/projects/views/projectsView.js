// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');
  var ProjectView = require('./projectView');

  var ProjectsView = OriginView.extend({
    className: 'projects',
    supportedLayouts: [
      "grid",
      "list"
    ],

    preRender: function(options) {
      OriginView.prototype.preRender.apply(this, arguments);
      this._isShared = options._isShared;
    },

    postRender: function() {
      this.settings.preferencesKey = 'dashboard';
      this.initUserPreferences();
      this.initEventListeners();
      this.initPaging();
    },

    initEventListeners: function() {
      this._doLazyScroll = _.throttle(this.doLazyScroll, 250).bind(this);
      this._onResize = _.debounce(this.onResize, 250).bind(this);

      this.listenTo(Origin, {
        'window:resize dashboard:refresh': this._onResize,
        'dashboard:dashboardSidebarView:filterBySearch': text => this.doFilter(text),
        'dashboard:dashboardSidebarView:filterByTags': tags => this.doFilter(null, tags),
        'dashboard:sort:asc': () => this.doSort('asc'),
        'dashboard:sort:desc': () => this.doSort('desc'),
        'dashboard:sort:updated': () => this.doSort('updated')
      });

      this.supportedLayouts.forEach(function(layout) {
        this.listenTo(Origin, `dashboard:layout:${layout}`, () => this.doLayout(layout));
      }, this);

      this.listenTo(this.collection, 'add', this.appendProjectItem);

      $('.contentPane').on('scroll', this._doLazyScroll);
    },

    initUserPreferences: function() {
      var prefs = this.getUserPreferences();

      this.doLayout(prefs.layout);
      this.doSort(prefs.sort, false);
      this.doFilter(prefs.search, prefs.tags, false);
      // set relevant filters as selected
      $(`a[data-callback='dashboard:layout:${prefs.layout}']`).addClass('selected');
      $(`a[data-callback='dashboard:sort:${prefs.sort}']`).addClass('selected');
      // need to refresh this to get latest filters
      prefs = this.getUserPreferences();
      Origin.trigger('options:update:ui', prefs);
      Origin.trigger('sidebar:update:ui', prefs);
    },

    // Set some default preferences
    getUserPreferences: function() {
      var prefs = OriginView.prototype.getUserPreferences.apply(this, arguments);

      if(!prefs.layout) prefs.layout = 'grid';
      if(!prefs.sort) prefs.sort = 'asc';

      return prefs;
    },

    initPaging: function() {
      if(this.resizeTimer) {
        clearTimeout(this.resizeTimer);
        this.resizeTimer = -1;
      }
      this.collection.options.limit = 50; // make initial page size BIG to make sure we load enough courses for any window size
      this.resetCollection(() => {
        var containerHeight = $(window).height()-this.$el.offset().top;
        var containerWidth = this.$('.projects-inner').width();
        var itemHeight = $('.project-list-item').outerHeight(true);
        var itemWidth = $('.project-list-item').outerWidth(true);
        var columns = Math.floor(containerWidth/itemWidth);
        var rows = Math.floor(containerHeight/itemHeight);
        // columns stack nicely, but need to add extra row if it's not a clean split
        if((containerHeight % itemHeight) > 0) rows++;
        this.collection.options.limit = columns*rows;
        // need another reset to get the actual pageSize number of items
        this.setViewToReady();
      });
    },

    getProjectsContainer: function() {
      return this.$('.projects-list');
    },

    emptyProjectsContainer: function() {
      Origin.trigger('dashboard:dashboardView:removeSubViews');
      this.getProjectsContainer().empty();
    },

    appendProjectItem: function(model) {
      var creator = model.get('createdBy') || { email: Origin.l10n.t('app.unknownuser') };
      var name = creator.firstName ? `${creator.firstName} ${creator.lastName}` : creator.email;
      if(this._isShared && name) model.set('creatorName', name);
      this.getProjectsContainer().append(new ProjectView({ model: model }).$el);
    },

    convertFilterTextToPattern: function(filterText) {
      var pattern = '.*' + filterText.toLowerCase() + '.*';
      return { title: pattern };
    },

    resetCollection: function(cb) {
      this.emptyProjectsContainer();
      this.collection.options.skip = 0;
      this.shouldStopFetches = false;
      this.collection.reset();
      this.fetchCollection(cb);
    },

    fetchCollection: function(cb) {
      if(this.shouldStopFetches) {
        return;
      }
      this.isCollectionFetching = true;

      this.collection.fetch({
        success: (collection, response) => {
          this.isCollectionFetching = false;
          this.collection.options.limit += response.length;
          // stop further fetching if this is the last page
          if(response.length < this.collection.options.limit) this.shouldStopFetches = true;

          this.$('.no-projects').toggleClass('display-none', this.collection.options.limit > 0);
          if(typeof cb === 'function') cb(collection);
        }
      });
    },

    doLazyScroll: function(e) {
      if(this.isCollectionFetching) {
        return;
      }
      var $el = $(e.currentTarget);
      var pxRemaining = this.getProjectsContainer().height() - ($el.scrollTop() + $el.height());
      // we're at the bottom, fetch more
      if (pxRemaining <= 0) this.fetchCollection();
    },

    doLayout: function(layout) {
      if(this.supportedLayouts.indexOf(layout) === -1) {
        return;
      }
      this.getProjectsContainer().attr('data-layout', layout);
      this.setUserPreference('layout', layout);
    },

    doSort: function(sort, fetch) {
      switch(sort) {
        case "desc":
          this.collection.options.sort = { title: -1 };
          break;
        case "updated":
          this.collection.options.sort = { updatedAt: -1 };
          break;
        case "asc":
        default:
          sort = "asc";
          this.collection.options.sort = { title: 1 };
      }
      this.setUserPreference('sort', sort);
      if(fetch !== false) this.resetCollection();
    },

    doFilter: function(text, tags, fetch) {
      text = text || '';
      this.filterText = text;
      this.search = this.convertFilterTextToPattern(text);
      this.setUserPreference('search', text, true);

      tags = tags || [];
      this.tags = _.pluck(tags, 'id');
      this.setUserPreference('tags', tags, true);

      if(fetch !== false) this.resetCollection();
    },

    onResize: function() {
      this.initPaging();
    },

    remove: function() {
      $('.contentPane').off('scroll', this._doLazyScroll);
      OriginView.prototype.remove.apply(this, arguments);
    }
  }, {
    template: 'projects'
  });

  return ProjectsView;
});
