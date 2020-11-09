// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(['backbone', 'underscore'], function(Backbone, _) {
  var ApiCollection = Backbone.Collection.extend({
    initialize : function(models, options) {
      Backbone.Collection.prototype.initialize.apply(this, arguments);
      if(!options) options = {};
      if(!this.url) this.url = options.url;
      this.customQuery = options.filter || {};
    },
    buildQuery: function() {
      var query = _.assign({}, this.customQuery);
      return query;
    },
    fetch: function(options) {
      Backbone.Collection.prototype.fetch.call(this, _.assign({
        url: this.url + '/query',
        method: 'POST',
        data: this.buildQuery()
      }, options));
    }
  });

  return ApiCollection;
});
