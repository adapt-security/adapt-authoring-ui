// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var ApiModel = require('core/models/apiModel');
  var Origin = require('core/origin');
  var UserProfileView = require('./views/userProfileView');

  Origin.on('user:profile', () => Origin.router.navigateTo('user/profile'));

  Origin.on('router:user', async function(location, subLocation, action) {
    if(location !== 'profile') {
      return;
    }
    const model = ApiModel.User({ _id: 'me' });
    await model.fetch();
    Origin.trigger('contentHeader:updateTitle', {title: Origin.l10n.t('app.editprofiletitle')});
    Origin.contentHeader.setButtons(Origin.contentHeader.BUTTON_TYPES.ACTIONS, Origin.contentHeader.ACTION_BUTTON_TEMPLATES.EDIT_FORM);
    Origin.contentPane.setView(UserProfileView, { model });
  });
});
