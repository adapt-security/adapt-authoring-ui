// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var ApiCollection = require('core/collections/apiCollection');
  var ContentCollection = require('core/collections/contentCollection');
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');
  var ProjectView = require('./projectView');

  var ProjectsView = OriginView.extend({
    className: 'projects',
    
    events: {
      'click .nav button': 'onNavigation',
    },

    preRender: function(options) {
      OriginView.prototype.preRender.apply(this, arguments);
      this.page = 1;
      this.pageSize = 250;
      this.configs = new ContentCollection(undefined, { _type: 'config' });
      this.courses = new ContentCollection(undefined, { _type: 'course' });
      this.users = ApiCollection.Users();
      this.tags = ApiCollection.Tags();
      
      this.listenTo(Origin, {
        'actions:createcourse': this.onCreateCourse,
        'actions:importcourse': this.onImportCourse,
        'filters': this.doFilter,
        'sorts': this.doSort
      });
      this.courses.on('sync', this.renderList, this);

      this.fetch();
    },

    renderList: function() {
      this.$('.project-list-item').remove();
      this.$('.no-projects').toggleClass('display-none', this.courses.length > 0);
      this.courses.forEach(this.renderProjectItem, this);
      
      const { Page, PageTotal } = this.courses.headerData;
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
          const { firstName, lastName } = this.users.findWhere({ _id: model.get('createdBy') }).attributes;
          creatorName = `${firstName} ${lastName}`;
        } catch(e) {}
        model.set('creatorName', creatorName);
      }
      model.set('tagTitles', model.get('tags').map(tId => this.tags.find(t => t.get('_id') === tId).get('title')));
      this.$('.projects-list').append(new ProjectView({ model }).$el);
    },

    fetch: async function(cb) {
      const fetchCourses = async () => {
        const courseQuery = this.configs.map(i => {
          return {
            $and: [
              {_lang: i.get('_defaultLanguage')},
              {_courseId: i.get('_courseId')}
            ]
          }
        })
        this.courses.customQuery = {
          ...(courseQuery.length > 0 && {$and: [{$or: courseQuery}]}),
          ...this.filterQuery
        }
        await this.courses.fetch({ recursive: false, reset: true })
      }

      try {
        Object.assign(this.configs.queryOptions, { page: this.page, limit: this.pageSize });
        Object.assign(this.courses.queryOptions, { page: this.page, limit: this.pageSize });
        Origin.trigger('origin:showLoadingSubtle');
        await Promise.all([
          this.tags.fetch(),
          this.users.fetch(),
          this.configs.fetch({ recursive: false, reset: true }),
        ]);
        await fetchCourses()
        Origin.trigger('origin:hideLoadingSubtle');
      } catch(e) {
        Origin.Notify.toast({ type: 'error', text: e.responseJson.message });
      }
    },

    doSort: function(sort) {
      this.courses.queryOptions.sort = sort;
      this.fetch();
    },
    
    doFilter: function(filters) {
      const filterQuery = {};

      if(filters.pageSize) {
        this.pageSize = filters.pageSize;
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
      if(filters.tags.length) {
        filterQuery.tags = { $all: filters.tags };
      }

      this.filterQuery = filterQuery;
      
      this.fetch();
    },

    onCreateCourse: function() {
      const { SweetAlert } = Origin.Notify.alert({
        title: Origin.l10n.t('app.addnewproject'),
        showCancelButton: true,
        showLoaderOnConfirm: true,
        html:
          `
          <label for="swal-input-title" class="swal2-input-label">${Origin.l10n.t('app.createcoursetitle')}</label>
          <input id="swal-input-title" class="swal2-input">
          <label for="swal-input-lang" class="swal2-input-label">${Origin.l10n.t('app.createcourselang')}</label>
          <input id="swal-input-lang" value="en" class="swal2-input">
          `,
        preConfirm: async () => {
          const title = document.getElementById('swal-input-title').value;
          let lang = document.getElementById('swal-input-lang').value;
          if (!title) {
            SweetAlert.showValidationMessage(Origin.l10n.t('app.createcoursemissingtitle'));
            return;
          }
          try {
            [lang] = Intl.getCanonicalLocales(lang)
          } catch (e) {
            SweetAlert.showValidationMessage(Origin.l10n.t('app.invalidlocale'));
            return;
          }
          try {
            const [ course ] = await $.ajax({ url: 'api/content/insertrecusive', method: 'post', data: { title, _lang:lang } });
            Origin.router.navigateTo(`editor/${course._id}/menu`);
          } catch(e) {
            SweetAlert.showValidationMessage(e.responseJSON.message);
          }
        }
      });
    },

    onImportCourse: function() {
      Origin.router.navigateTo('frameworkImport');
    },

    onNavigation: function(event) {
      const currentPage = this.page;
      const nextPage = $(event.currentTarget).hasClass('prev') ? currentPage-1 : currentPage+1;
      if(nextPage !== 0 && nextPage <= this.courses.headerData.PageTotal) {
        this.page = nextPage;
      }
    }
  }, {
    template: 'projects'
  });

  return ProjectsView;
});
