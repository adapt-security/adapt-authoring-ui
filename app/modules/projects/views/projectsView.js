// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var CourseModel = require('core/models/courseModel');
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');
  var ProjectView = require('./projectView');
  var UserCollection = require('modules/userManagement/collections/userCollection');

  var ProjectsView = OriginView.extend({
    className: 'projects',
    supportedLayouts: [
      "grid",
      "list"
    ],

    preRender: function(options) {
      OriginView.prototype.preRender.apply(this, arguments);
      this._isShared = options._isShared;
      this.allTags = options.tags.models.slice() || [];
      this.usersCollection = new UserCollection();
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
        'actions:createcourse': () => {
          Origin.trigger('contentHeader:updateTitle', { breadcrumbs: ['dashboard'], title: Origin.l10n.t('app.editornew') });
          Origin.contentPane.setView(EditorFormView, { model: new CourseModel() });
        },
        'actions:importcourse': () => {
          Origin.router.navigateTo('frameworkImport');
        },
        'filters': this.doFilter,
        'sorts': this.doSort,
        'window:resize dashboard:refresh': this._onResize
      });

      this.supportedLayouts.forEach(l => {
        this.listenTo(Origin, `dashboard:layout:${l}`, () => this.doLayout(l));
      }, this);

      $('.contentPane').on('scroll', this._doLazyScroll);
    },

    initUserPreferences: function() {
      var prefs = this.getUserPreferences();

      this.doLayout(prefs.layout);
      this.doSort(prefs.sort, false);
      this.doFilter(prefs.filter, false);
      // set relevant filters as selected
      $(`a[data-callback='dashboard:layout:${prefs.layout}']`).addClass('selected');
      $(`a[data-callback='dashboard:sort:${prefs.sort}']`).addClass('selected');
      // need to refresh this to get latest filters
      prefs = this.getUserPreferences();
    },

    // Set some default preferences
    getUserPreferences: function() {
      var prefs = OriginView.prototype.getUserPreferences.apply(this, arguments);

      if(!prefs.layout) prefs.layout = {};
      if(!prefs.sort) prefs.sort = {};

      return prefs;
    },

    initPaging: function() {
      if(this.resizeTimer) {
        clearTimeout(this.resizeTimer);
        this.resizeTimer = -1;
      }
      var $item = new ProjectView({ model: new CourseModel() }).$el;
      var containerHeight = $(window).height()-this.$el.offset().top;
      var itemHeight = $item.outerHeight(true);
      var columns = Math.floor(this.$('.projects-inner').width()/$item.outerWidth(true));
      var rows = Math.floor(containerHeight/itemHeight);
      // columns stack nicely, but need to add extra row if it's not a clean split
      if((containerHeight % itemHeight) > 0) rows++;
      this.collection.queryOptions.limit = columns*rows;
      this.resetCollection(this.setViewToReady);
    },

    getProjectsContainer: function() {
      return this.$('.projects-list');
    },

    emptyProjectsContainer: function() {
      Origin.trigger('dashboard:dashboardView:removeSubViews');
      this.getProjectsContainer().empty();
    },

    appendProjectItem: function(model) {
      let creatorName;
      try {
        const { firstName, lastName } = this.usersCollection.findWhere({ _id: model.get('createdBy') }).attributes;
        creatorName = `${firstName} ${lastName}`;
      } catch(e) {
        creatorName = Origin.l10n.t('app.unknownuser');
      }
      if(this._isShared && creatorName) model.set('creatorName', creatorName);
      model.set('tagTitles', model.get('tags').map(tId => this.allTags.find(t => t.get('_id') === tId).get('title')));
      this.getProjectsContainer().append(new ProjectView({ model }).$el);
    },

    resetCollection: function(cb) {
      this.emptyProjectsContainer();
      this.allCourses = [];
      this.page = 1;
      this.collection.queryOptions.collation = { locale: navigator.language.substring(0, 2) };
      this.shouldStopFetches = false;
      this.collection.reset();
      this.fetchCollection(cb);
    },

    fetchCollection: function(cb) {
      if(this.shouldStopFetches) {
        return;
      }
      this.isCollectionFetching = true;
      
      this.usersCollection.fetch({
        success: (collection, response) => {
          Object.assign(this.collection.queryOptions, {
            skip: this.allCourses.length,
            page: this.page++,
          });
          this.collection.fetch({
            success: (collection, response) => {
              this.isCollectionFetching = false;
              this.allCourses.push(...collection.models);

              this.$('.project-list-item').remove();
              this.allCourses.forEach(a => this.appendProjectItem(a));

              // stop further fetching if this is the last page
              if(response.length < this.collection.queryOptions.limit) this.shouldStopFetches = true;
    
              this.$('.no-projects').toggleClass('display-none', this.allCourses.length > 0);
              if(typeof cb === 'function') cb(collection);
            }
          });
        }
      });
    },

    doLazyScroll: function(e) {
      if(this.isCollectionFetching) {
        return;
      }
      const $last = $('.project-list-item').last();
      const triggerY = ($('.contentPane').offset().top + $('.contentPane').height()) - ($last.height()/2) ;
      
      if($last.offset().top < triggerY) this.fetchCollection();
    },

    doLayout: function(layout) {
      if(this.supportedLayouts.indexOf(layout) === -1) {
        return;
      }
      this.getProjectsContainer().attr('data-layout', layout);
      this.setUserPreference('layout', layout);
    },

    doSort: function(data, fetch) {
      // let data;
      // switch(sort) {
      //   case "desc":
      //     data = { title: -1 };
      //     break;
      //   case "updated":
      //     data = { updatedAt: -1 };
      //     break;
      //   case "asc":
      //   default:
      //     sort = "asc";
      //     data = { title: 1 };
      // }
      // this.collection.queryOptions.sort = data;
      // this.setUserPreference('sort', sort);
      if(fetch !== false) this.resetCollection();
    },

    doFilter: function(data, fetch) {
      // this.collection.customQuery.title = { 
      //   $regex: `.*${text.toLowerCase()}.*`,
      //   $options: 'i'
      // };
      // this.setUserPreference('search', text, true);

      // this.collection.customQuery.tags = _.pluck(tags, 'id');
      // this.setUserPreference('tags', this.collection.queryOptions.tags, true);

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
