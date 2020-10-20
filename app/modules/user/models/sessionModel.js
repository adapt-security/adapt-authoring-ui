// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(['require', 'backbone', 'core/origin'], function(require, Backbone, Origin) {
  var SessionModel = Backbone.Model.extend({
    url: "api/auth/check",

    login: function (email, password, shouldPersist) {
      $.post('api/auth/local', { email: email, password: password })
        .done(function (token) {
          this.fetch({ 
            success: function() {
              Origin.trigger('login:changed');
              Origin.trigger('schemas:loadData', Origin.router.navigateToHome);
            },
            error: function(jqXhr) {
              Origin.trigger('login:failed', jqXHR.status);
            }
          });
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
          Origin.trigger('login:failed', jqXHR.status);
        });
    },

    logout: function () {
      $.post('api/auth/disavow', _.bind(function() {
        // revert to the defaults
        this.set(this.defaults);
        Origin.trigger('login:changed');
        Origin.router.navigateToLogin();
      }, this));
    },
  });

  return SessionModel;
});
