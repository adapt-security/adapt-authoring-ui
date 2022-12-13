// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var OriginView = require('core/views/originView');
  var Origin = require('core/origin');

  var NavigationView = OriginView.extend({
    tagName: 'nav',
    className: 'navigation',

    initialize: function() {
      this.listenTo(Origin, 'login:changed', this.loginChanged);
      this.render();
    },

    events: {
      'click a.navigation-item':'onNavigationItemClicked'
    },

    render: function() {
      if(Origin.sessionModel.get('isAuthenticated')) OriginView.prototype.render.apply(this);
    },

    loginChanged: function() {
      this.render();
    },

    onNavigationItemClicked: function(event) {
      event.preventDefault();
      event.stopPropagation();
      Origin.trigger('navigation:' + $(event.currentTarget).attr('data-event'));
    }
  }, {
    template: 'navigation'
  });

  return NavigationView;
});
