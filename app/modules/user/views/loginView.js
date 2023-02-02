// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');

  var LoginView = OriginView.extend({
    className: 'login',
    tagName: "div",
    events: {
      'keydown #login-input-username' : 'clearErrorStyling',
      'keydown #login-input-password' : 'clearErrorStyling',
      'click .login-form-submit'      : 'submitLoginDetails',
      'click button.dash'             : 'goHome'
    },

    postRender: function() {
      this.setViewToReady();
      Origin.trigger('login:loaded');
    },

    goHome: function(e) {
      e && e.preventDefault();
      Origin.router.navigateToDashboard();
    },

    handleEnterKey: function(e) {
      var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;

      if (key == 13) {
        e.preventDefault();
        this.submitLoginDetails();
      }
    },

    clearErrorStyling: function(e) {
      $('#login-input-username').removeClass('input-error');
      $('#loginError').addClass('display-none');

      this.handleEnterKey(e);
    },

    submitLoginDetails: function(e) {
      e && e.preventDefault();

      var inputUsernameEmail = $.trim(this.$("#login-input-username").val());
      var inputPassword = $.trim(this.$("#login-input-password").val());
      var shouldPersist = this.$('#remember-me').prop('checked');

      // Validation
      if (inputUsernameEmail === '' || inputPassword === '') {
        this.loginFailed(LoginView.ERR_MISSING_FIELDS);
        return false;
      } else {
        $('#login-input-username').removeClass('input-error');
      }
      this.model.login(inputUsernameEmail, inputPassword, shouldPersist, error => {
        if(error) {
          return this.loginFailed(null, error.message);
        }
        Origin.router.navigateToDashboard();
      });
    },

    loginFailed: function(errorCode, message) {
      $('#login-input-username').addClass('input-error');
      $('#login-input-password').val('');
      $('#loginErrorMessage').text(message || this.errorCodeToMessage(errorCode));
      $('#loginError').removeClass('display-none');
    },

    errorCodeToMessage: function(errorCode) {
      switch (errorCode) {
        case LoginView.ERR_INVALID_CREDENTIALS:
        case LoginView.ERR_MISSING_FIELDS:
          return Origin.l10n.t('app.invalidusernameorpassword');
        case LoginView.ERR_ACCOUNT_LOCKED:
          return Origin.l10n.t('app.accountislocked');
        case LoginView.ERR_ACCOUNT_INACTIVE:
          return Origin.l10n.t('app.accountnotactive');
      }
    }

  }, {
    ERR_INVALID_CREDENTIALS: 1,
    ERR_ACCOUNT_LOCKED: 2,
    ERR_MISSING_FIELDS: 3,
    ERR_TENANT_DISABLED: 4,
    ERR_ACCOUNT_INACTIVE: 5,
    template: 'login'
  });

  return LoginView;
});
