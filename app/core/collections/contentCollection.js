// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define([
  '../collections/apiCollection',
  '../models/contentModel',
  '../origin',
  '../helpers'
], function(ApiCollection, ContentModel, Origin, Helpers) {
  var ContentCollection = ApiCollection.extend({
    url: 'api/content',
    model: ContentModel,

    initialize : function(models, options) {
      ApiCollection.prototype.initialize.apply(this, arguments);
    
      this._type = options._type;
      if(this._type) this.model = Helpers.contentModelMap(this._type);
      this._courseId = options._courseId;
      this._parentId = options._parentId;
    
      this.on('reset', function() {
        Origin.trigger('contentCollection:dataLoaded', this._type);
      }, this);
    },
    buildQuery: function() {
      var query = ApiCollection.prototype.buildQuery.apply(this, arguments);
      if(this._type) query._type = this._type;
      if(this._courseId) query._courseId = this._courseId;
      if(this._parentId) query._parentId = this._parentId;
      return query;
    }
  });

  return ContentCollection;
});
