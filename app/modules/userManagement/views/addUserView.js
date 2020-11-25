// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Helpers = require('core/helpers');
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');

  var AddUserView = OriginView.extend({
    tagName: 'div',
    className: 'addUser',
    createdUserId: false,

    preRender: function() {
      Origin.trigger('location:title:update', { title: Origin.l10n.t('app.addusertitle') });
      this.listenTo(Origin, 'userManagement:saveUser', this.saveNewUser);
    },

    postRender: function() {
      this.setViewToReady();
    },

    isValid: function() {
      var valid = true;

      this.$('.field-error').each(function(index, element) {
        var $error = $(element);
        var $input = $error.siblings('input');

        var isValid = $input.attr('name') === 'email' ?
          Helpers.isValidEmail($input.val().trim()) :
          $input.val().trim().length > 0;

        $error.toggleClass('display-none', isValid);

        if (!isValid) valid = false;
      });

      return valid;
    },

    saveNewUser: function() {
      if(!this.isValid()) {
        return;
      }
      this.$('form.addUser').ajaxSubmit({
        success: () => this.onFormSuccess(),
        error: jqXhr => this.onFormError(jqXhr)
      });
    },

    goBack: function() {
      Origin.router.navigateTo('userManagement');
    },

    onFormSuccess: function(userData, userStatus, userXhr) {
      this.goBack();

    },

    onFormError: function(jqXhr) {
      // We may have a partially created user, make sure it's gone
      if(this.createdUserId) {
        $.ajax('api/users/' + this.createdUserId, { method: 'DELETE', error: _.bind(this.onAjaxError, this) });
      }
      Origin.Notify.alert({
        type: 'error',
        title: "Couldn't add user",
        text: jqXhr.responseText || error
      });
    }
  }, {
    template: 'addUser'
  });

  return AddUserView;
});
