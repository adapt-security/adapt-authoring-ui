// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define([
  '../collections/apiCollection',
  '../models/contentModel',
  'core/models/courseModel',
  'core/models/contentObjectModel',
  'core/models/articleModel',
  'core/models/blockModel',
  'core/models/componentModel',
  '../origin',
  '../helpers'
], function(ApiCollection, ContentModel, CourseModel, ContentObjectModel, ArticleModel, BlockModel, ComponentModel, Origin, Helpers) {
  var ContentCollection = ApiCollection.extend({
    url: 'api/content',
    model: ContentModel,
    comparator: '_sortOrder',

    initialize : function(models, options) {
      ApiCollection.prototype.initialize.apply(this, arguments);
    
      this._type = options._type;

      if(this._type) {
        let m;
        switch (this._type) {
          case 'course': m = CourseModel; break;
          case 'contentobject': m = ContentObjectModel; break;
          case 'article': m = ArticleModel; break;
          case 'block': m = BlockModel; break;
          case 'component': m = ComponentModel;
        }
        this.model = m;
      }

      this._courseId = options._courseId;
      this._parentId = options._parentId;
    
      this.on('reset', () => Origin.trigger('contentCollection:dataLoaded', this._type));
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
