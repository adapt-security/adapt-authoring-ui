// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');

  var ContentModel = Backbone.Model.extend({
    idAttribute: '_id',
    attributeBlacklist: null,
    urlRoot: 'api/content',

    serialize: function() {
      return JSON.stringify(this);
    },
    pruneAttributes: function() {
      if(this.attributeBlacklist) {
        Object.keys(this.attributes).forEach(function(key) {
          if(_.contains(this.attributeBlacklist, key)) this.unset(key);
        }, this);
      }
    }
  });

  return ContentModel;
});
