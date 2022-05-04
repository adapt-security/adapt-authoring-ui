// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var ContentModel = require('./contentModel');

  var ConfigModel = ContentModel.extend({
    _type: 'config',
    _parent: 'course',
    // Custom sync to allow a _courseId to be specified instead of an _id
    sync: function(method, model, options) {
      options = options || {};

      var _id = this.get('_id');
      var query = `?_type=config&_courseId=${this.get('_courseId')}`;

      options.url = `api/content/${_id ? _id : query}`;

      return Backbone.sync.apply(this, arguments);
    }
  });

  return ConfigModel;
});
