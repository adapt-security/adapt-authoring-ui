// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Backbone = require('backbone');
  var ApiCollection = require('core/collections/apiCollection');
  var Helpers = require('core/helpers');
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');

  var AddUserView = OriginView.extend({
    tagName: 'div',
    className: 'addUser',
    createdUserId: false,
    settings: {
      autoRender: false,
    },
    
    preRender: function() {
      Origin.contentHeader.setTitle({ title: Origin.l10n.t('app.addusertitle') });
      this.listenTo(Origin, {
        'actions:save': this.saveNewUser,
        'actions:cancel': this.navigateBack
      });
      this.model = new Backbone.Model({ allRoles: new ApiCollection([], { url: 'api/roles' })});
      this.model.get('allRoles').fetch();
      this.model.get('allRoles').on('sync', this.render, this);
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
      const $form = this.$('form.addUser');
      const data = $form.serializeArray().reduce((memo,{ name, value }) => {
        if(name === 'roles') value = [value];
        return Object.assign(memo, { [name]: value });
      }, {});
      $.ajax($form.attr('action'), {
        type: $form.attr('method'),
        data: JSON.stringify(data),
        contentType: 'application/json',
        success: () => this.navigateBack(),
        error: jqXhr => this.onFormError(jqXhr)
      })
    },

    navigateBack: function() {
      Origin.router.navigateTo('userManagement');
    },

    onFormError: function(jqXhr) {
      // We may have a partially created user, make sure it's gone
      if(this.createdUserId) {
        $.ajax('api/users/' + this.createdUserId, { method: 'DELETE', error: _.bind(this.onAjaxError, this) });
      }
      Origin.Notify.toast({
        type: 'error',
        title: Origin.l10n.t('app.adduserfail'),
        text: jqXhr.responseJSON && jqXhr.responseJSON.message || jqXhr
      });
    }
  }, {
    template: 'addUser'
  });

  return AddUserView;
});
