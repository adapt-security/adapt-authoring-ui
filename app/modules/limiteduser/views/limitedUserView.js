// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var OriginView = require('core/views/originView');

  var LimitedUserView = OriginView.extend({
    className: 'limiteduser'
  }, {
    template: 'limitedUser'
  });

  return LimitedUserView;
});
