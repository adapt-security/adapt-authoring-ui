// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var ContentCollection = require('core/collections/contentCollection');
  var CourseModel = require('core/models/courseModel');
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');
  var ProjectView = require('./projectView');
  var TagsCollection = require('core/collections/tagsCollection');
  var UserCollection = require('modules/userManagement/collections/userCollection');

  var ProjectsView = OriginView.extend({
    className: 'projects',
    supportedLayouts: [
      "grid",
      "list"
    ],

    preRender: function(options) {
      OriginView.prototype.preRender.apply(this, arguments);
      this.courseCollection = new ContentCollection(undefined, { _type: 'course' });
      this.usersCollection = new UserCollection();
      this.tagsCollection = new TagsCollection();
    },

    postRender: function() {
      this.initEventListeners();
      this.initPaging();
    },

    initEventListeners: function() {
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
    },

    // Set some default preferences
    getUserPreferences: function() {
      return Object.assign({ sort: {} }, OriginView.prototype.getUserPreferences.apply(this, arguments));
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
      this.courseCollection.queryOptions.limit = columns*rows;
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
      model.set('tagTitles', model.get('tags').map(tId => this.tagsCollection.find(t => t.get('_id') === tId).get('title')));
      this.getProjectsContainer().append(new ProjectView({ model }).$el);
    },

    resetCollection: function(cb) {
      this.emptyProjectsContainer();
      this.page = 1;
      this.courseCollection.queryOptions.collation = { locale: navigator.language.substring(0, 2) };
      this.shouldStopFetches = false;
      this.courseCollection.reset();
      this.fetch(cb);
    },

    fetch: async function(cb) {
      if(this.shouldStopFetches) {
        return;
      }
      this.isFetching = true;
      try {
        await Promise.all([
          this.tagsCollection.fetch(),
          this.usersCollection.fetch(),
          this.courseCollection.fetch()
        ]);
        Object.assign(this.courseCollection.queryOptions, { page: this.page });
        this.isFetching = false;
        this.$('.project-list-item').remove();
        this.courseCollection.forEach(this.appendProjectItem, this);

        this.$('.no-projects').toggleClass('display-none', this.courseCollection.length > 0);
        if(typeof cb === 'function') cb(this.courseCollection);

      } catch(e) {
        Origin.notify.alert({ type: 'error', text: e.responseJson.message });
      }
    },

    doSort: function(sort, fetch) {
      this.courseCollection.queryOptions.sort = sort;
      this.setUserPreference('sort', sort);
      if(fetch !== false) this.resetCollection();
    },
    
    doFilter: function(filters, fetch = true) {
      const filterQuery = {};

      if(filters.search) {
        filterQuery.title = {  $regex: `.*${filters.search.toLowerCase()}.*`, $options: 'i' };
      }
      if(filters.author.mine || filters.author.shared) {
        const meId = Origin.sessionModel.get('user')._id;
        filterQuery.$or = [];
        if(filters.author.mine) filterQuery.$or.push({ createdBy: meId });
        if(filters.author.shared) filterQuery.$or.push({ createdBy: { $ne: meId } });
      }
      if(filters.tags) {
        filterQuery.tags = _.pluck(filters.tags, 'id');
      }
      Object.assign(this.courseCollection.customQuery, filterQuery);
      
      if(fetch) this.resetCollection();
    },

    onResize: function() {
      this.initPaging();
    }
  }, {
    template: 'projects'
  });

  return ProjectsView;
});
