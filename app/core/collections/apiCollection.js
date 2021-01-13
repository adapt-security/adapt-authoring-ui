// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(['backbone', 'underscore'], function(Backbone, _) {
  var ApiCollection = Backbone.Collection.extend({
    options: {},
    
    initialize : function(models, options) {
      Backbone.Collection.prototype.initialize.apply(this, arguments);
      if(!options) options = {};
      if(!this.url) this.url = options.url;
      this.customQuery = options.filter || {};
    },
    buildQuery: function() {
      return _.assign({}, this.customQuery);
    },
    buildQueryParams: function() {
      return _.isEmpty(this.options) ? '' : Object.entries(this.options).reduce((q,[k,v]) => `${q}${k}=${JSON.stringify(v)}&`, '?');
    },
    fetch: function(options) {
      Backbone.Collection.prototype.fetch.call(this, _.assign({
        url: `${this.url}/query${this.buildQueryParams()}`,
        method: 'POST',
        data: this.buildQuery()
      }, options));
    }
  });

  return ApiCollection;
});
