// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(['require', 'backbone'], function(require, Backbone) {
  var SessionModel = Backbone.Model.extend({
    url: "api/auth/check",

    initialize: function(Origin) {
      this.Origin = Origin;

      this.on('sync', () => this.set('isAuthenticated', true));
      this.on('error', (model, jqXhr) => {
        const error = jqXhr?.responseJSON?.message;
        this.set({ isAuthenticated: false, error });
      });
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

    login: function (email, password, cb) {
      const onError = ({ responseJSON }) => {
        this.clear();
        cb(responseJSON);
      };
      $.post('api/auth/local', { email, password })
        .done(() => {
          this.fetch({ 
            success: () => {
              this.once('sync', () => {
                cb();
                this.Origin.trigger('login:changed');
              });
            },
            error: onError
          });
        })
        .fail(onError);
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
