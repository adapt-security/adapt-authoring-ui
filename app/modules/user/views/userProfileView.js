// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Backbone = require('backbone');
  var OriginView = require('core/views/originView');
  var Origin = require('core/origin');

  var UserProfileView = OriginView.extend({
    tagName: 'div',
    className: 'user-profile',

    events: {
      'click a.change-password' : 'togglePassword',
      'keyup #password'         : 'onPasswordKeyup',
      'click .toggle-password'  : 'togglePasswordView'
    },

    preRender: function() {
      this.listenTo(Origin, {
        'actions:save': this.saveUser,
        'actions:cancel': Origin.router.navigateBack
      });
      this.listenTo(this.model, 'invalid', this.handleValidationError);
      this.listenTo(this.model, 'change:_isNewPassword', this.togglePasswordUI);

      this.model.set('_isNewPassword', false);
    },

    postRender: function() {
      this.setViewToReady();
    },

    handleValidationError: function(model, error) {
      Origin.trigger('sidebar:resetButtons');

      if (error && _.keys(error).length !== 0) {
        _.each(error, function(value, key) {
          this.$('#' + key + 'Error').text(value);
        }, this);
        this.$('.error-text').removeClass('display-none');
      }
    },

    togglePassword: function(event) {
      event && event.preventDefault();
      // convert to bool and invert
      this.model.set('_isNewPassword', !!!this.model.get('_isNewPassword'));
    },

    togglePasswordUI: function(model, showPaswordUI) {
      var formSelector = 'div.change-password-section .form-group .inner';
      var buttonSelector = '.change-password';

      if (showPaswordUI) {
        this.$(formSelector).removeClass('display-none');
        this.$(buttonSelector).text(Origin.l10n.t('app.cancel'));
      } else {
        this.$(buttonSelector).text(Origin.l10n.t('app.changepassword'));
        this.$(formSelector).addClass('display-none');

        this.$('#password').val('').removeClass('display-none');
        this.$('#passwordText').val('').addClass('display-none');
        this.$('.toggle-password i').addClass('fa-eye').removeClass('fa-eye-slash');

        this.$('.toggle-password').addClass('display-none');
        this.$('#passwordError').html('');

        this.model.set('password', '');
      }
    },

    togglePasswordView: function(event) {
      event && event.preventDefault();
      const isHidden = this.$('#password').attr('type') === 'password';
      this.$('#password').attr('type', isHidden ? 'text' : 'password');
      this.$('.toggle-password i').toggleClass('fa-eye').toggleClass('fa-eye-slash');
    },

    indicatePasswordStrength: async function(password) {
      if(!password.length) {
        return this.$('#passwordFeedback').addClass('display-none');
      }
      let successMsg, errorMsg;
      try {
        successMsg = (await $.post('api/auth/local/validatepass', { password })).message;
      } catch(e) { // format the API error message to look a bit nicer in the UI
        const [message, errors] = e.responseJSON.message.split('. ');
        errorMsg = `${message}:<ul>${errors.split(', ').map(e => `<li>${e}</li>`).join('')}</ul>`;
      }
      $('#passwordFeedback').removeClass().addClass(errorMsg ? 'error' : 'success').html(errorMsg || successMsg);
    },

    saveUser: function() {
      var email_prev = this.model.get('email');

      this.$('.error-text').addClass('display-none');
      this.$('.error').text('');

      var toChange = {
        firstName: this.$('#firstName').val().trim(),
        lastName: this.$('#lastName').val().trim(),
        email: this.$('#email').val().trim()
      };
      this.model.unset('password');

      _.extend(toChange, { _id: this.model.get('_id'), email_prev });

      this.model.save(toChange, {
        wait: true,
        patch: true,
        success: async () => {
          if (!this.model.get('_isNewPassword')) {
            return Backbone.history.history.back();
          }
          try {
            await $.post('api/auth/local/changepass', { password: this.$('#password').val() });
            Origin.sessionModel.logout(); 
          } catch(e) {
            this.handleError(e);  
          }
        },
        error: function(data, error) {
          this.handleError(error);
        }
      });
    },

    handleError(error) {
      Origin.trigger('sidebar:resetButtons');
      const text = error.responseJSON && error.responseJSON.message || Origin.l10n.t('app.errorgeneric');
      Origin.Notify.alert({ type: 'error', text });
    },

    onPasswordKeyup: function() {
      const password = this.$('#password').val();
      this.$('.toggle-password').toggleClass('display-none', !password.length);
      // only check password at set intervals to reduce API calls
      clearTimeout(this.updatePasswordTimeout);
      this.updatePasswordTimeout = setTimeout(async () => await this.indicatePasswordStrength(password), 500);
    }
  }, {
    template: 'userProfile'
  });

  return UserProfileView;
});
