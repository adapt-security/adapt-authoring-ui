define(['backbone', 'underscore', '../helpers'], function(Backbone, _, Helpers) {
  /**
   * Class for collecting API data
   * @class ApiCollection
   */
  var ApiCollection = Backbone.Collection.extend({
    options: {},
    initialize : function(models, options) {
      Backbone.Collection.prototype.initialize.apply(this, models);
      this.queryOptions = {};
      if(!options) options = {};
      if(!this.url) this.url = options.url;
      this.customQuery = options.filter || {};
    },
    /**
     * Creates a query object from the set attributes
     * @function ApiCollection#buildQuery
     * @returns {Object}
     */
    buildQuery: function() {
      return _.assign({}, this.customQuery);
    },
    /**
     * Creates a query string from the set attributes
     * @function ApiCollection#buildQueryParams
     * @returns {Object}
     */
    buildQueryParams: function() {
      return _.isEmpty(this.queryOptions) ? '' : Object.entries(this.queryOptions).reduce((q,[k,v]) => `${q}${k}=${JSON.stringify(v)}&`, '?');
    },
    /**
     * Fetches API data
     * @function ApiCollection#fetch
     * @param {Object} options
     * @returns {Promise}
     */
    fetch: async function(options = {}) {
      const _fetch = (url, memo = []) => {
        return new Promise((resolve, reject) => {
          Backbone.Collection.prototype.fetch.call(this, _.assign({
            url,
            method: 'POST',
            data: this.buildQuery(),
            success: async (d, status, res) => {
              memo.push(...d.models);
              const { next } = Helpers.parseLinksHeader(res);
              if(options.fetchAll !== false && next) await _fetch(next, memo);
              resolve(memo);
            },
            error: console.log
          }, options));
        });
      };
      this.reset(await _fetch(`${this.url}/query${this.buildQueryParams()}`));
    },
    /**
     * Fetches the previous page of data
     * @function ApiCollection#fetchPrevPage
     * @returns {Promise}
     */
    fetchPrevPage: function() {
      if(!this.links.prev) return this.fetch();
    },
    /**
     * Fetches the next page of data
     * @function ApiCollection#fetchNextPage
     * @returns {Promise}
     */
    fetchNextPage: function() {
    }
  });
  
  /**
   * Shorthand for creating new ApiCollections
   */
  const createCollection = (type, data = {}) => {
    return new ApiCollection(data.models || [], { 
      url: `api/${type}`, 
      customQuery: data.customQuery || {}, 
      comparator: data.comparator || 'createdBy'
    });
  };
  ApiCollection.Assets = (data = {}) => createCollection('assets', Object.assign(data, { comparator: 'title' }));
  ApiCollection.ContentPlugins = (data = {}) => createCollection('contentplugins', Object.assign({ queryOptions: { includeUpdateInfo: false } }, data, { comparator: 'displayName' }));
  ApiCollection.CourseThemePresets = (data = {}) => createCollection('coursethemepresets', Object.assign(data, { comparator: '' }));
  ApiCollection.Tags = (data = {}) => createCollection('tags', Object.assign(data, { comparator: 'title' }));
  ApiCollection.Users = (data = {}) => createCollection('users', Object.assign(data, { comparator: 'email' }));

  return ApiCollection;
});
