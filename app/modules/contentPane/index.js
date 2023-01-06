// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var ContentPaneView = require('./views/contentPaneView');

  var cpv = new ContentPaneView();
  $('.app-inner').append(cpv.$el);

  Origin.contentPane = {
    setView: function(ViewClass, viewOptions = {}, options = {}) {
      cpv.setView(new ViewClass(viewOptions), options);
    },
    enableScroll: function() {
      cpv.$el.removeClass('no-scroll');
    },
    disableScroll: function() {
      cpv.$el.addClass('no-scroll');
    }
  };
});
