define(['backbone', 'underscore', 'core/origin', 'core/models/apiModel'], function(Backbone, _, Origin, ApiModel) {
  /**
   * Class for collecting API data
   * @class ApiCollection
   */
  var ApiCollection = Backbone.Collection.extend({
    model: ApiModel,
    options: {},
    initialize : function(models, options) {
      Backbone.Collection.prototype.initialize.apply(this, models);
      this.queryOptions = {};
      if(!options) options = {};
      if(!this.comparator) this.comparator = options.comparator;
      if(!this.url) this.url = options.url;
      this.customQuery = options.customQuery || {};
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
    fetch: async function(options = { recursive: true, silent: true }) {
      const _fetch = (url, memo = []) => {
        return new Promise((resolve, reject) => {
          Backbone.Collection.prototype.fetch.call(this, _.assign({
            url,
            method: 'POST',
            data: JSON.stringify(this.buildQuery()),
            contentType : 'application/json',
            success: async (d, status, res) => {
              memo.push(...d.models);
              const headers = ['Page', 'PageSize', 'PageTotal'];
              this.headerData = headers.reduce((m, h) => Object.assign(m, { [h]: Number(res.xhr.getResponseHeader(`X-Adapt-${h}`)) }), {});
              const link = res.xhr.getResponseHeader('Link');
              if(link && options.recursive) {
                const nextUrlMatch = link.match(/<[^>]*>; rel="next"/);
                if(nextUrlMatch) {
                  const nextUrl = nextUrlMatch[0].match(/<(.*)>/);
                  await _fetch(nextUrl[1], memo);
                }
              }
              resolve(memo);
            }, 
            error: (model, jqXhr) => {
              const error = jqXhr && jqXhr.responseJSON;
              
              if(options.silent === false) return reject(new Error(error));
              
              const errorFormatted = JSON.stringify(error, null, '&nbsp;').replaceAll('\n', '<br/>');

              Origin.Notify.alert({ 
                type: 'error', 
                text: `${Origin.l10n.t('app.errorfetchingdata', { url: this.url })}
                  <details><summary>Debug information</summary><pre>${errorFormatted}</pre></details>`
              });
            }
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
