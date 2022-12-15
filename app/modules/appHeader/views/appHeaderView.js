// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var OriginView = require('core/views/originView');
  var Origin = require('core/origin');

  var AppHeaderView = OriginView.extend({
    tagName: 'nav',
    className: 'appHeader',

    initialize: function() {
      this.listenTo(Origin, 'login:changed', this.loginChanged);
      this.listenTo(Origin, 'help', this.onHelpClicked);
      this.render();
    },

    events: {
      'click a.appHeader-item':'onItemClicked'
    },

    render: function() {
      if(Origin.sessionModel.get('isAuthenticated')) OriginView.prototype.render.apply(this);
    },

    loginChanged: function() {
      this.render();
    },

    getWikiPage: function() {
      switch (Origin.location.module) {
        case 'assetManagement': return 'Asset-Management';
        case 'pluginManagement': return 'Plugin-Management';
        case 'projects': return 'The-Dashboard';
        case 'project': return 'Creating-a-Course#course-details';
        case 'userManagement': return 'User-Management';
        case 'editor':
          let page = 'Creating-a-Course#';
          switch (Origin.location.route2) {
            case 'block': return `${page}adding-content-to-the-course`;
            case 'config': return `${page}course-settings`;
            case 'edit': return `${page}sectionpage-settings`;
            case 'extensions': return `${page}course-settings`;
            case 'menu': return `${page}editing-course-details`;
            case 'page': return `${page}adding-content-to-the-course`;
            case 'theme': return `${page}course-settings`;
          }
      }
    },

    onHelpClicked: function() {
      window.open(Origin.constants.supportLink || `https://github.com/adaptlearning/adapt_authoring/wiki/${this.getWikiPage()}`);
    },

    onItemClicked: function(event) {
      event.preventDefault();
      event.stopPropagation();
      Origin.trigger($(event.currentTarget).attr('data-event'));
    }
  }, {
    template: 'appHeader'
  });

  return AppHeaderView;
});