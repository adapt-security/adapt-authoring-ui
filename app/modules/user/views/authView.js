// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');

  var AuthView = OriginView.extend({
    className: 'auth',
    tagName: "div",
    events: {
      'click .local' : 'onSelectLocalAuth'/* ,
      'click .github': 'onSelectGitHubAuth' */
    },

    postRender: function() {
      this.setViewToReady();
    },

    onSelectLocalAuth() {
      Origin.router.navigateTo('user/login');
    },

    onSelectGitHubAuth() {
      
    }

  }, {
    template: 'auth'
  });

  return AuthView;
});
