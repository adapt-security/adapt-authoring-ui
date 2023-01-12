// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Backbone = require('backbone');
  var ContentCollection = require('core/collections/contentCollection');
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');
  var ProjectView = require('./projectView');
  var TagsCollection = require('core/collections/tagsCollection');
  var UserCollection = require('modules/userManagement/collections/userCollection');

  var ProjectsView = OriginView.extend({
    className: 'projects',
    
    events: {
      'click .nav button': 'onNavigation',
    },

    preRender: function(options) {
      OriginView.prototype.preRender.apply(this, arguments);
      this.model = new Backbone.Model({ page: 1, limit: 25 });
      this.courseCollection = new ContentCollection(undefined, { _type: 'course' });
      this.usersCollection = new UserCollection();
      this.tagsCollection = new TagsCollection();

      this.model.on('change', this.fetch, this);
      this.courseCollection.on('sync', this.renderList, this);
      this.tagsCollection.on('sync', () => this.model.set('tags', this.tagsCollection), this);

      this.listenTo(Origin, {
        'actions:createcourse': this.onCreateCourse,
        'actions:importcourse': this.onImportCourse,
        'filters': this.doFilter,
        'sorts': this.doSort
      });

      this.fetch();
    },

    renderList: function() {
      this.$('.project-list-item').remove();
      this.$('.no-projects').toggleClass('display-none', this.courseCollection.length > 0);
      this.courseCollection.forEach(this.renderProjectItem, this);
      
      const { Page, PageTotal } = this.courseCollection.headerData;
      this.$('.nav .summary .currentCount').text(Page);
      this.$('.nav .summary .totalCount').text(PageTotal);
      this.$('.nav button.prev').toggleClass('disabled', Page === 1);
      this.$('.nav button.next').toggleClass('disabled', Page === PageTotal);
      this.$('.nav').toggleClass('display-none', PageTotal === 1);
    },

    renderProjectItem: function(model) {
      if(model.get('createdBy') !== Origin.sessionModel.get('user')._id) {
        let creatorName = Origin.l10n.t('app.unknownuser');
        try {
          const { firstName, lastName } = this.usersCollection.findWhere({ _id: model.get('createdBy') }).attributes;
          creatorName = `${firstName} ${lastName}`;
        } catch(e) {}
        model.set('creatorName', creatorName);
      }
      model.set('tagTitles', model.get('tags').map(tId => this.tagsCollection.find(t => t.get('_id') === tId).get('title')));
      this.$('.projects-list').append(new ProjectView({ model }).$el);
    },

    fetch: async function(cb) {
      try {
        Object.assign(this.courseCollection.queryOptions, { page: this.model.get('page'), limit: this.model.get('limit') });
        await Promise.all([
          this.tagsCollection.fetch(),
          this.usersCollection.fetch(),
          this.courseCollection.fetch({ recursive: false, reset: true })
        ]);
      } catch(e) {
        Origin.Notify.alert({ type: 'error', text: e.responseJson.message });
      }
    },

    doSort: function(sort) {
      this.courseCollection.queryOptions.sort = sort;
      this.fetch();
    },
    
    doFilter: function(filters) {
      const filterQuery = {};

      if(filters.pageSize) {
        this.model.set('pageSize', filters.pageSize);
      }
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
        filterQuery.tags = { $all: filters.tags };
      }
      this.courseCollection.customQuery = filterQuery;
      
      this.fetch();
    },

    onCreateCourse: function() {
      const { SweetAlert } = Origin.Notify.alert({
        title: Origin.l10n.t('app.newcoursetitle'),
        input: 'text',
        inputLabel: Origin.l10n.t('app.newcourseinstruction'),
        showCancelButton: true,
        showLoaderOnConfirm: true,
        inputValidator: val => !val && Origin.l10n.t('app.invalidempty'),
        preConfirm: async title => {
          try {
            const { _id } = await $.ajax({ url: 'api/content/createcourse', method: 'post', data: { title } });
            Origin.router.navigateTo(`editor/${_id}/menu`);
          } catch(e) {
            SweetAlert.showValidationMessage(e);
          }
        }
      });
    },

    onImportCourse: function() {
      Origin.router.navigateTo('frameworkImport');
    },

    onNavigation: function(event) {
      const currentPage = this.model.get('page');
      const nextPage = $(event.currentTarget).hasClass('prev') ? currentPage-1 : currentPage+1;
      if(nextPage !== 0 && nextPage <= this.courseCollection.headerData.PageTotal) {
        this.model.set('page', nextPage);
      }
    }
  }, {
    template: 'projects'
  });

  return ProjectsView;
});
