// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  const Origin = require('core/origin');
  const ContentHeaderView = require('./views/contentHeaderView');
  Origin.contentHeader = new ContentHeaderView();
});
