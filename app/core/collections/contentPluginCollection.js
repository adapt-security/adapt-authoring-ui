// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var ApiCollection = require('core/collections/apiCollection');
  var ContentPluginModel = require('core/models/contentPluginModel');

  var ContentPluginCollection = ApiCollection.extend({
    url: 'api/contentplugins',
    model: ContentPluginModel,
    comparator: 'displayName',

    initialize : function(models, options) {
      ApiCollection.prototype.initialize.call(this, arguments);
      this.type = options && options.type;
      if(options.queryOptions) Object.assign(this.queryOptions, { includeUpdateData: false }, options.queryOptions);
    },
    buildQuery: function() {
      var query = ApiCollection.prototype.buildQuery.call(this);
      if(this.type && !query.type) query.type = this.type;
      return query;
    }
  });

  return ContentPluginCollection;
});
