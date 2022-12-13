// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(['underscore', 'backbone'], function(_, Backbone) {
  var Origin;
  var Router = Backbone.Router.extend({
    routes: {
      '': 'handleIndex',
      '_=_': 'handleIndex',
      ':module(/*route1)(/*route2)(/*route3)(/*route4)': 'handleRoute'
    },
    restrictedRoutes: {},
    dashboardHandlers: [],

    initialize: function(origin) {
      Origin = origin;
      Origin.router = this;
      Origin.trigger('router:initialize');
      this.locationKeys = ['module', 'route1', 'route2', 'route3', 'route4'];
      this.resetLocation();
      Origin.on('origin:dataReady', () => Backbone.history.start());
    },

    updateLocation: function(routeArgs) {
      // save the previous location
      Origin.previousLocation = Origin.location;

      this.evaluateDashboardRoute();

      this.resetLocation();
      this.locationKeys.forEach((k,i) => Origin.location[k] = routeArgs[i]);

      var [mod, route1] = routeArgs;
      $('body')
        .removeClass()
        .addClass(`module-${mod}${route1 ? ` location-${route1}` : ''}`);

      Origin.trigger('location:change', Origin.location);
    },

    resetLocation: function() {
      Origin.location = {};
    },
    // Allows modules/plugins to customise dashboard routing
    addDashboardHandler: function(handler) {
      this.dashboardHandlers.push(handler);
    },

    restrictRoute: function(route, scopes) {
      if(this.restrictedRoutes[route]) {
        return console.warn(`Route '${route}' already restricted`);
      }
      this.restrictedRoutes[route] = scopes;
    },
    // Checks user permissions for route
    verifyRoute: function(mod, route1) {
      // Check this user has permissions
      var requiredScopes = this.restrictedRoutes[Backbone.history.fragment];
      if(requiredScopes && !Origin.sessionModel.hasScopes(requiredScopes)) {
        return this.blockUserAccess();
      }
      // FIXME routes shouldn't be hard-coded
      if(!Origin.sessionModel.get('isAuthenticated') && (mod !== 'user' && route1 !== 'login')) {
        return this.blockUserAccess(Origin.sessionModel.get('error'), true);
      }
      return true;
    },

    // Boots user to the login screen with an error message
    blockUserAccess: function(message, hideUI) {
      if(hideUI) {
        $('body').addClass('no-ui');
        Origin.trigger('remove:views');
      }
      Origin.Notify.alert({
        type: 'error',
        title: Origin.l10n.t('app.errorpagenoaccesstitle'),
        text: message || Origin.l10n.t('app.errorpagenoaccess'),
        confirmButtonText: Origin.l10n.t('app.ok'),
        callback: this.navigateToLogin.bind(this)
      });
    },

    // Persist any dashboard routing for 'Back to courses' link
    // FIXME this shouldn't be here, or work like this...
    evaluateDashboardRoute: function() {
      var loc = Origin.location;
      if (loc && loc.module == 'dashboard') {
        var suffix = loc.route1 ? '/' + loc.route1 : '';
        Origin.dashboardRoute = '#/dashboard' + suffix;
      }
    },

    // Routing

    formatRoute: function(route) {
      /**
      * We remove leading slashes as they force trigger:true regardless of the
      * options passed to Backbone.Router.navigate
      * See https://github.com/jashkenas/backbone/issues/786
      */
      if(route[0] === '/') return route.slice(1);
      return route;
    },

    persistRoute: function(route) {
      this.navigate(this.formatRoute(route));
    },

    navigateBack: function() {
      Backbone.history.history.back();
    },

    navigateTo: function(route) {
      // use Origin.router.navigate in case we don't have a valid 'this' reference
      this.navigate(this.formatRoute(route), { trigger: true });
    },

    navigateToLogin: function() {
      // use Origin.router.navigate in case we don't have a valid 'this' reference
      this.navigateTo('user/login');
    },

    navigateToDashboard: function() {
      for (const h of this.dashboardHandlers) {
        const route = h();
        if(route) return this.navigateTo(route);
      }
      Origin.Notify.alert({ type: 'error', text: 'Router.navigateToDashboard: cannot load dashboard, no valid dashboard handler' });
    },

    handleIndex: function() {
      Origin.trigger('origin:showLoading');
      Origin.sessionModel.get('isAuthenticated') ? this.navigateToDashboard() : this.navigateToLogin();
    },

    handleRoute: function(module, route1, route2, route3, route4) {
      Origin.removeViews();
      if(!this.verifyRoute(module, route1)) {
        return;
      }
      this.updateLocation(arguments);
      Origin.trigger('router', module, route1, route2, route3, route4);
      Origin.trigger('router:' + module, route1, route2, route3, route4);
    }
  });

  return Router;
});