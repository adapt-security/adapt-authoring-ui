// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var _ = require('underscore');
  var Backbone = require('backbone');
  var Helpers = require('core/helpers');
  var Origin = require('core/origin');

  var UserProfileModel = Backbone.Model.extend({
    idAttribute: '_id',
    url: 'api/users/me',

    validate: function(attributes) {
      var validationErrors = {};

      if (!attributes.firstName) {
        validationErrors.firstName = Origin.l10n.t('app.validationrequired');
      }
      if (!attributes.lastName) {
        validationErrors.lastName = Origin.l10n.t('app.validationrequired');
      }
      if (!attributes.email) {
        validationErrors.email = Origin.l10n.t('app.validationrequired');
      } else if (!Helpers.isValidEmail(attributes.email)) {
        validationErrors.email = Origin.l10n.t('app.invalidusernameoremail');
      }
      if (attributes._isNewPassword) {
        if (!attributes.password) {
          validationErrors.password = Origin.l10n.t('app.validationrequired');
        } else {
          if (attributes.password.length < 8) {
            validationErrors.password = Origin.l10n.t('app.validationlength', {length: 8});
          }
        }
      }
      return _.isEmpty(validationErrors) ? null : validationErrors;
    }

  });

  return UserProfileModel;
});