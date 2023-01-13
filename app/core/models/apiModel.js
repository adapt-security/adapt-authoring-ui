// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');

  var ApiModel = Backbone.Model.extend({
    idAttribute: '_id',
    attributeBlacklist: null,
    
    constructor: function(attributes, options) {
      Backbone.Model.prototype.constructor.call(this, attributes, options);
      this.urlRoot = `api/${options.endpoint}`;
    },

    serialize: function() {
      return JSON.stringify(this);
    },
    pruneAttributes: function() {
      if(this.attributelacklist) this.attributeBlacklist.forEach(this.unset);
    }
  });
  /**
   * Shorthand for creating new ApiModels
   */
  const createModel = (type, data) => {
    return new ApiModel(data, { endpoint: type });
  };
  ApiModel.Asset = data => createModel('assets', data);
  ApiModel.ContentPlugin = data => createModel('contentplugins', data);
  ApiModel.CourseThemePreset = data => createModel('coursethemepresets', data);
  ApiModel.Tag = data => createModel('tags', data);
  ApiModel.User = data => createModel('users', data);

  return ApiModel;
});
