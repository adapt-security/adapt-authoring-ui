// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var LimitedUserViewView = require('./views/limitedUserView');

  Origin.on('router:limiteduser', (location, subLocation, action) => {
    Origin.contentPane.setView(LimitedUserViewView);
  });
});