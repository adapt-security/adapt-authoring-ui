// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(['require', 'core/models/apiModel'], function(require, ApiModel) {
  var SessionModel = ApiModel.extend({
    initialize: function(Origin, options = {}) {
      options.endpoint = 'auth/check';
      ApiModel.prototype.initialize.call(this, {}, options);
      // need to access Origin this way to avoid circular dependency
      this.Origin = Origin;

      this.on('sync error', (model, jqXhr) => this.updateAuthStatus(jqXhr.hasOwnProperty('status') ? jqXhr : undefined));
      Origin.on('window:active', this.checkAuthStatus, this);

      this.checkAuthStatus();
    },

    hasScopes: function(scopes) {
      if(!scopes) {
        return false;
      }
      if(this.get('isSuper')) {
        return true;
      }
      if(!Array.isArray(scopes)) {
        scopes = [scopes];
      }
      var assignedScopes = this.get('scopes');
      if(!assignedScopes || !assignedScopes.length) {
        return false;
      }
      return scopes.every(s => assignedScopes.includes(s));
    },

    checkAuthStatus: async function() {
      if(this.Origin.location && this.Origin.location.module === 'user' && this.Origin.location.route1 !== 'profile') {
        return;
      }
      try {
        await this.fetch({ silent: false });
      } catch(e) {
        this.Origin.Notify.alert({ type: 'info', text: this.Origin.l10n.t('app.loggedout') });
        this.Origin.router.navigateToLogin();
      }
    },

    updateAuthStatus: function(jqXhr) {
      const isInit = !this.has('isAuthenticated');
      this.set({ 
        isAuthenticated: jqXhr === undefined,
        error: jqXhr && jqXhr.responseJSON && jqXhr.responseJSON.message
      });
      if(isInit) this.trigger('ready');
    },

    login: async function (email, password, persistSession, cb) {
      try {
        await $.ajax({ 
          url: 'api/auth/local',
          method: 'POST',
          data: JSON.stringify({ email, password, persistSession }),
          contentType: "application/json",
          dataType: "json"
        });
        await this.fetch();
        this.Origin.trigger('login:changed');
        cb();
      } catch({ responseJSON }) {
        this.clear();
        cb(responseJSON);
      }
    },

    logout: async function() {
      try {
        await $.post('api/auth/disavow');
      } catch(e) {
        console.error(e);
      }
      this.clear();
      this.Origin.trigger('login:changed');
      this.Origin.router.navigateToLogin();
    }
  });

  return SessionModel;
});
