// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');

  var ApiModel = Backbone.Model.extend({
    idAttribute: '_id',
    attributeBlacklist: null,
    
    constructor: function(attributes, options) {
      super(attributes, options);
      this.urlRoot = `api/${options.endpoint}`;
    },

    serialize: function() {
      return JSON.stringify(this);
    },
    pruneAttributes: function() {
      if(this.attributelacklist) this.attributeBlacklist.forEach(this.unset);
    }
  });

  return ApiModel;
});
