// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var _ = require('underscore');
  var Backbone = require('backbone');
  var Origin = require('core/origin');

  var ContentHeaderView = Backbone.View.extend({
    className: 'contentHeader',

    initialize: function() {
      this.listenTo(Origin, {
        'contentHeader:updateTitle': this.render,
        'contentHeader:hide': this.onHideTitle
      });
    },

    render: function(data) {
      var template = Handlebars.templates[this.constructor.template];
      this.$el.html(template(this.processData(data)));
      _.defer(_.bind(this.postRender, this));
      return this;
    },

    processData: function(data) {
      if(!data || !data.breadcrumbs) {
        return data;
      }
      // add some shortcuts to common locations
      // Dashboard
      var dashboardI = data.breadcrumbs.indexOf('dashboard');
      if(dashboardI > -1) {
        data.breadcrumbs.splice(dashboardI, 1, { title: Origin.l10n.t('app.dashboard'), url: '#' });
      }
      // Course
      var course = Origin.editor && Origin.editor.data && Origin.editor.data.course;
      if(!course) {
        return data;
      }
      var courseI = data.breadcrumbs.indexOf('course');
      if(courseI > -1) {
        data.breadcrumbs.splice(courseI, 1, {
          title: Origin.l10n.t('app.editormenu'),
          url: '#/editor/' + course.get('_id') + '/menu'
        });
      }
      // so we can show the course name if the current title isn't already that...
      if(course && course.get('title') !== data.title) {
        data.course = course.toJSON();
      }
      return data;
    },

    postRender: function() {
      this.$('.contentHeader-inner').removeClass('display-none');
      Origin.trigger('contentHeader:title:postRender', this);
    },

    onHideTitle: function() {
      this.$('.contentHeader-inner').addClass('display-none');
    }
  }, {
    template: 'contentHeader'
  });

  return ContentHeaderView;
});
