// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(['require', 'backbone'], function(require, Backbone) {
  var SessionModel = Backbone.Model.extend({
    url: "api/auth/check",

    initialize: function(Origin) {
      this.Origin = Origin;

      this.on('sync', function() {  this.set('isAuthenticated', true); });
      this.on('error', function() {  this.set('isAuthenticated', false); });
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
      return scopes.every(function(s) { return assignedScopes.includes(s); });
    },

    login: function (email, password, shouldPersist) {
      $.post('api/auth/local', { email: email, password: password })
        .done((function (token) {
          this.fetch({ 
            success: function() {
              this.Origin.trigger('login:changed');
              this.Origin.router.navigateToHome();
            },
            error: function(jqXhr) {
              this.Origin.trigger('login:failed', jqXHR.status);
            }
          });
        }).bind(this))
        .fail(function(jqXHR, textStatus, errorThrown) {
          this.Origin.trigger('login:failed', jqXHR.status);
        });
    },

    logout: function () {
      $.post('api/auth/disavow', _.bind(function() {
        // revert to the defaults
        this.set(this.defaults);
        this.Origin.trigger('login:changed');
        this.Origin.router.navigateToLogin();
      }, this));
    },
  });

  return SessionModel;
});
