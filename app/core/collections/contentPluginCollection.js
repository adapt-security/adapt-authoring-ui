// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var ContentPluginModel = require('core/models/contentPluginModel');

  var ContentCollection = Backbone.Collection.extend({
    url: 'api/contentplugins',
    model: ContentPluginModel,

    initialize : function(models, options) {
      this.type = options && options.type;
    },
    fetch: function(options) {
      if(this.type) options.url = this.url + '?type=' + this.type;
      Backbone.Collection.prototype.fetch.call(this, options);
    }
  });

  return ContentCollection;
});
