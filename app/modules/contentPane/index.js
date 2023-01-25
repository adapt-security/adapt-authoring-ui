// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var ContentPaneView = require('./views/contentPaneView');
  Origin.contentPane = new ContentPaneView();
});
