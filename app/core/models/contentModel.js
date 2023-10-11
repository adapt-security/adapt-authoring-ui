// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');

  var ContentModel = Backbone.Model.extend({
    idAttribute: '_id',
    attributeBlacklist: null,
    urlRoot: 'api/content',

    initialize: function() {
      if(!this.get('_type')) this.set('_type', this._type);
      if(this.get('_type') === 'article') {
        this.set('_isCollapsible', true);
      }
    },

    serialize: function() {
      return JSON.stringify(this);
    },
    pruneAttributes: function() {
      if(this.attributeBlacklist) this.attributeBlacklist.forEach(this.unset);
    }
  });

  return ContentModel;
});
