// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var LimitedUserViewView = require('./views/limitedUserView');

  Origin.on('router:limiteduser', (location, subLocation, action) => {
    Origin.contentPane.setView(LimitedUserViewView);
    Origin.trigger('contentHeader:hide');
  });

  Origin.on('router:initialize login:changed', function() {
    Origin.router.addDashboardHandler(() => {
      if(!Origin.sessionModel.hasScopes(['read:content'])) return 'limiteduser';
    });
  });
});