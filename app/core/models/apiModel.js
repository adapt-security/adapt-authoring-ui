// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(['backbone'], function(Backbone) {

  var ApiModel = Backbone.Model.extend({
    idAttribute: '_id',
    attributeBlacklist: null,
    urlRoot: 'api/',
 
    initialize: function(attributes, options) {
      Backbone.Model.prototype.initialize.call(this, attributes, options);
      if(!options.endpoint && options.url) { // get endpoint from URL when adding from ApiCollection
        options.endpoint = options.url.match(/api\/(.+)\/query/)[1];
      }
      this.urlRoot = `api/${options.endpoint}`;
    },
    /**
     * Fetches model data
     * @function ApiModel#fetch
     * @param {Object} options
     * @returns {Promise}
     */
    fetch: async function(options = { silent: true }) {
      return new Promise((resolve, reject) => {
        Backbone.Model.prototype.fetch.call(this, _.assign({
          success: () => resolve(this), 
          error: (model, jqXhr) => this.onFetchError(jqXhr, options.silent === false ? reject : undefined)
        }, options));
      });
    },
    /**
     * Saves model data
     * @function ApiModel#save
     * @param {Object} options
     * @returns {Promise}
     */
    save: async function(attributes, options = { silent: true }) {
      return new Promise((resolve, reject) => {
        Backbone.Model.prototype.save.call(this, attributes, _.assign({
          success: () => resolve(this), 
          error: (model, jqXhr) => this.onFetchError(jqXhr, options.silent === false ? reject : undefined)
        }, options));
      });
    },

    serialize: function() {
      return JSON.stringify(this);
    },
    pruneAttributes: function() {
      if(this.attributelacklist) this.attributeBlacklist.forEach(this.unset);
    },
    onFetchError: function(jqXhr, reject) {
      const Origin = require('core/origin');
      const error = jqXhr && jqXhr.responseJSON;
      
      if(reject) return reject(new Error(error));
      
      const errorFormatted = JSON.stringify(error, null, '&nbsp;').replaceAll('\n', '<br/>');

      Origin.Notify.alert({ 
        type: 'error', 
        text: `${Origin.l10n.t('app.errorfetchingdata', { url: this.url() })}
          <details><summary>Debug information</summary>${errorFormatted}</details>`
      });
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