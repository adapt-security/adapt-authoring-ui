// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var ContentHeaderView = require('./views/contentHeaderView');

  Origin.on('appHeader:postRender', () => {
    $('#app').prepend(new ContentHeaderView().$el);
  });
})
