// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var ForgotPasswordView = require('./views/forgotPasswordView');
  var LoginView = require('./views/loginView');
  var Origin = require('core/origin');
  var ResetPasswordView = require('./views/resetPasswordView');

  Origin.on('user:logout', function() {
    Origin.router.navigateTo('user/logout');
  });

  Origin.on('user:profile', function() {
    Origin.router.navigateTo('user/profile');
  });

  Origin.on('router:user', async function(location, subLocation, action, _, query) {
    var currentView;
    var model = Origin.sessionModel;
    var settings = {};

    if(location.indexOf('reset') === 0) { // hack fix this
      $('body').removeClass(`location-${location}`);
      try {
        query = parseQueryString(query);
      } catch(e) {}
      location = 'reset';
      $('body').addClass(`location-${location}`);
    }
    settings.authenticate = false;

    switch(location) {
      case 'login':
        if(model.get('isAuthenticated')) return Origin.router.navigateToDashboard();
        Origin.trigger('contentHeader:hide');
        currentView = LoginView;
        break;
      case 'logout':
        Origin.sessionModel.logout();
        break;
      case 'forgot':
        currentView = ForgotPasswordView;
        break;
      case 'reset':
        currentView = ResetPasswordView;
        model = new Backbone.Model(query);
        break;
    }
    if(currentView) Origin.contentPane.setView(currentView, { model });
  });

  function parseQueryString(queryString) {
    try {
      if (queryString[0] === '?') queryString = queryString.slice(1)
      return queryString.split('&').reduce((m,s) => {
        const [k,v] = s.split('=');
        return Object.assign(m, { [k]: v });
      }, {});
    } catch(e) {
      return {};
    }
  }
});
