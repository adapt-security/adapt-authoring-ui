// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var _ = require('underscore');
  var Backbone = require('backbone');
  var Origin = require('core/origin');
  var Helpers = require('core/helpers');

  var ContentCollection = Backbone.Collection.extend({
    url: 'api/content',

    initialize : function(models, options) {
      this._type = options._type;
      this.model = Helpers.contentModelMap(this._type);
      this._courseId = options._courseId;
      this._parentId = options._parentId;
      this.customQuery = options.filter || {};
    
      this.on('reset', function() {
        Origin.trigger('contentCollection:dataLoaded', this._type);
      }, this);
    },
    buildQuery: function() {
      var query = _.assign(this.customQuery, { _type: this._type });
      if(this._courseId) query._courseId = this._courseId;
      if(this._parentId) query._parentId = this._parentId;
      _.assign(query, this.customQuery);
      return query;
    },
    fetch: function(options) {
      Backbone.Collection.prototype.fetch.call(this, {
        url: 'api/content/query',
        method: 'POST',
        data: this.buildQuery()
      });
    }
  });

  return ContentCollection;
});
