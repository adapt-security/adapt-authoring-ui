// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var ForgotPasswordView = require('./views/forgotPasswordView');
  var LoginView = require('./views/loginView');
  var Origin = require('core/origin');
  var ResetPasswordView = require('./views/resetPasswordView');
  var UserProfileModel = require('./models/userProfileModel');
  var UserProfileSidebarView = require('./views/userProfileSidebarView');
  var UserProfileView = require('./views/userProfileView');

  Origin.on('navigation:user:logout', function() {
    Origin.router.navigateTo('user/logout');
  });

  Origin.on('navigation:user:profile', function() {
    Origin.router.navigateTo('user/profile');
  });

  Origin.on('router:user', async function(location, subLocation, action) {
    var currentView;
    var model = Origin.sessionModel;
    var settings = {};
    var query = {};
    
    if(location.indexOf('reset') === 0) { // hack fix this
      $('body').removeClass(`location-${location}`);
      try {
        query = parseQueryString(location);
      } catch(e) {}
      location = 'reset';
      $('body').addClass(`location-${location}`);
    }
    settings.authenticate = false;

    switch(location) {
      case 'login':
        Origin.trigger('location:title:hide');
        currentView = LoginView;
        break;
      case 'logout':
        Origin.sessionModel.logout();
        break;
      case 'forgot':
        Origin.trigger('sidebar:sidebarContainer:hide');
        currentView = ForgotPasswordView;
        break;
      case 'reset':
        Origin.trigger('sidebar:sidebarContainer:hide');
        currentView = ResetPasswordView;
        model = new Backbone.Model(query);
        break;
      case 'profile':
        settings.authenticate = true;
        Origin.trigger('location:title:update', {title: Origin.l10n.t('app.editprofiletitle')});
        model = new UserProfileModel();
        await model.fetch();
        currentView = UserProfileView;
        Origin.sidebar.addView(new UserProfileSidebarView().$el);
        break;
    }
    if(currentView) Origin.contentPane.setView(currentView, { model });
  });

  function parseQueryString(queryString) {
    try {
      return queryString.split('?')[1].split('&').reduce((m,s) => {
        const [k,v] = s.split('=');
        return Object.assign(m, { [k]: v });
      }, {});
    } catch(e) {
      return {};
    }
  }
});
