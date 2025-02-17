// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Backbone = require('backbone');
  var OriginView = require('core/views/originView');
  var Origin = require('core/origin');

  var UserProfileView = OriginView.extend({
    tagName: 'div',
    className: 'user-profile',

    events: {
      'click a.change-password' : 'changePassword'
    },

    preRender: function() {
      this.listenTo(Origin, 'userProfileSidebar:views:save', this.saveUser);
      this.listenTo(this.model, 'invalid', this.handleValidationError);
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

    changePassword: function(event) {
      event.preventDefault();

      Origin.Notify.alert({
        title: 'Change password',
        html: `<div style="overflow-x:hidden">
          Enter your current password
          <input id="old_pass" class="swal2-input" type="password"><br/><br/>
          Choose a new password
          <input id="new_pass" class="swal2-input" type="password"><br/><br/>
          Confirm new password
          <input id="new_pass_confirm" class="swal2-input" type="password">
        </div>`,
        showCancelButton: true,
        preConfirm: async () => {
          const oldPassword = $('#old_pass').val();
          const password = $('#new_pass').val();
          const passwordConfirm = $('#new_pass_confirm').val();
          try {
            let errors = [];
            if(!oldPassword.length) errors.push('Missing current password value');
            if(!password.length) errors.push('Missing new password value');
            if(!passwordConfirm.length) errors.push('Missing confirmation password value');
            if(password !== passwordConfirm) errors.push('Passwords must match!');

            if(errors.length) throw new Error(errors.join(', '));

            await $.post('api/auth/local/validatepass', { password });
            await $.post('api/auth/local/changepass', { oldPassword, password });
            Origin.sessionModel.checkAuthStatus()

          } catch(e) {
            Origin.Notify.Swal.showValidationMessage((e.responseJSON && e.responseJSON.message) || e.message);
            return false;
          }
        }
      });
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
        success: () => Backbone.history.history.back(),
        error: (data, error) => this.handleError(error)
      });
    },

    handleError(error) {
      Origin.trigger('sidebar:resetButtons');
      const text = error.responseJSON && error.responseJSON.message || Origin.l10n.t('app.errorgeneric');
      Origin.Notify.alert({ type: 'error', text });
    }
  }, {
    template: 'userProfile'
  });

  return UserProfileView;
});
