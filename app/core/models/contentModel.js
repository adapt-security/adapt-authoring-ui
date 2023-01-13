// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var ApiModel = require('./apiModel');

  var ContentModel = ApiModel.extend({
    constructor: function(attributes, options) {
      options.type = 'content';
      super(attributes, options);
    },

    initialize: function() {
      if(!this.get('_type')) this.set('_type', this._type);
      if(this.get('_type') === 'article') {
        this.set('_isCollapsible', true);
      }
    }
  });

  return ContentModel;
});
