// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var OriginView = require('core/views/originView');
  var Origin = require('core/origin');

  var ResetPasswordView = OriginView.extend({
    tagName: "div",
    className: "reset-password",

    events: {
      'click .form-reset-password button' : 'resetPassword',
      'click button.cancel' : 'goToLogin',
      'click button.return' : 'goToLogin'
    },

    preRender: function() {
      this.listenTo(this.model, {
        sync: this.verifyToken,
        invalid: this.handleValidationError
      });
    },

    postRender: function() {
      this.setViewToReady();
    },

    goToLogin: function(e) {
      e && e.preventDefault();
      Origin.router.navigateToLogin();
    },

    handleValidationError: function(model, errors) {
      if(errors) {
        this.$('.resetError .message').text(this.errors.reduce((m,e) => `${m}${e}. `, ''));
        this.$('.resetError').removeClass('display-none');
      }
    },

    verifyToken: function() {
      // Invalid token entered, take the user to login
      if(!this.model.get('user')) Origin.router.navigateToLogin();
    },

    resetPassword: async function(event) {
      event.preventDefault();

      const password = this.$('#password').val();

      if(password !== this.$('#confirmPassword').val()) {
        return this.handleValidationError(this.model, [Origin.l10n.t('app.passwordnomatcherror')]);
      }
      try {
        await $.post('api/auth/local/changepass', { password, email: this.model.get('email'), token: this.model.get('token') });
        this.$('.form-reset-password').addClass('display-none');
        this.$('.reset-introduction').addClass('display-none');
        this.$('.message .success').removeClass('display-none');
      } catch(e) {
        Origin.Notify.toast({ type: 'error', text: Origin.l10n.t('app.resetpassworderror') });
        console.error(e);
      }
    }
  }, {
    template: 'resetPassword'
  });

  return ResetPasswordView;

});
