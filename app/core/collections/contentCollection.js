// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define([
  'backbone',
  'underscore',
  '../models/contentModel',
  '../origin',
  '../helpers'
], function(Backbone, _, ContentModel, Origin, Helpers) {
  var ContentCollection = Backbone.Collection.extend({
    url: 'api/content',
    model: ContentModel,

    initialize : function(models, options) {
      this._type = options._type;
      if(this._type) this.model = Helpers.contentModelMap(this._type);
      this._courseId = options._courseId;
      this._parentId = options._parentId;
      this.customQuery = options.filter || {};
    
      this.on('reset', function() {
        Origin.trigger('contentCollection:dataLoaded', this._type);
      }, this);
    },
    buildQuery: function() {
      var query = _.assign({}, this.customQuery);
      if(this._type) query._type = this._type;
      if(this._courseId) query._courseId = this._courseId;
      if(this._parentId) query._parentId = this._parentId;
      return query;
    },
    fetch: function(options) {
      Backbone.Collection.prototype.fetch.call(this, _.assign({
        url: 'api/content/query',
        method: 'POST',
        data: this.buildQuery()
      }, options));
    }
  });

  return ContentCollection;
});
