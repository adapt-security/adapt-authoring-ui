// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');

  var ContentPluginModel = Backbone.Model.extend({
    idAttribute: '_id',
    urlRoot: 'api/contentplugins',
  });
  return ContentPluginModel;
});
