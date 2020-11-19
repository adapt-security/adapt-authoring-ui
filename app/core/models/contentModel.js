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
      if(this.attributelacklist) this.attributeBlacklist.forEach(this.unset);
    }
  });

  return ContentModel;
});
