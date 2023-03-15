// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(['require', 'backbone'], function(require, Backbone) {
  var SessionModel = Backbone.Model.extend({
    url: "api/auth/check",

    initialize: function(Origin) {
      this.Origin = Origin;

      this.on('sync', () => this.set('isAuthenticated', true));
      this.on('error', (model, jqXhr) => {
        const error = jqXhr.responseJSON && jqXhr.responseJSON.message;
        this.set({ isAuthenticated: false, error });
      });
      Origin.on('window:active', this.checkAuthStatus, this);
    },

    hasScopes: function(scopes) {
      if(!scopes) {
        return false;
      }
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

    checkAuthStatus: async function() {
      if(this.Origin.location && this.Origin.location.module === 'user' && this.Origin.location.route1 !== 'profile') {
        return;
      }
      try {
        await this.fetch({ silent: false });
      } catch(e) {
        if(this.Origin.modal) this.Origin.modal.show(false);
        if(this.Origin.Notify) this.Origin.Notify.toast({ type: 'info', text: this.Origin.l10n.t('app.loggedout') });
        if(this.Origin.router) this.Origin.router.navigateToLogin();
      }
    },

    login: function (email, password, persistSession, cb) {
      const onError = ({ responseJSON }) => {
        this.clear();
        cb(responseJSON);
      };
      $.ajax({ 
        url: 'api/auth/local',
        method: 'POST',
        data: JSON.stringify({ email, password, persistSession }),
        contentType: "application/json",
        dataType: "json"
      })
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
        if(this.get('isAuthenticated')) await $.post('api/auth/disavow');
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
