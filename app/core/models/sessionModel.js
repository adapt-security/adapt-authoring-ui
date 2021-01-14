// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(['require', 'backbone'], function(require, Backbone) {
  var SessionModel = Backbone.Model.extend({
    url: "api/auth/check",

    initialize: function(Origin) {
      this.Origin = Origin;

      this.on('sync', () => this.set('isAuthenticated', true));
      this.on('error', () => this.set('isAuthenticated', false));
    },

    hasScopes: function(scopes) {
      var assignedScopes = this.get('scopes');
      if(this.get('isSuper')) {
        return true;
      }
      if(!assignedScopes || !assignedScopes.length) {
        return false;
      }
      if(!Array.isArray(scopes)) {
        return assignedScopes.includes(scopes);
      }
      return scopes.every(s => assignedScopes.includes(s));
    },

    login: function (email, password, shouldPersist, cb) {
      $.post('api/auth/local', { email, password })
        .done(() => {
          this.fetch({ 
            success: () => {
              this.Origin.trigger('login:changed');
              this.once('sync', () => cb());
            },
            error: ({ responseJSON }) => cb(responseJSON)
          });
        })
        .fail(({ responseJSON }) => cb(responseJSON));
    },
    
    logout: async function() {
      try {
        await $.post('api/auth/disavow');
      } catch(e) {
        return console.error(e);
      }
      this.clear();
      this.Origin.trigger('login:changed');
      this.Origin.router.navigateToLogin();
    }
  });

  return SessionModel;
});
