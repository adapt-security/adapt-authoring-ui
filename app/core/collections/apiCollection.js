// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(['backbone', 'underscore'], function(Backbone, _) {
  var ApiCollection = Backbone.Collection.extend({
    options: {},
    
    initialize : function(models, options) {
      Backbone.Collection.prototype.initialize.apply(this, arguments);
      if(!options) options = {};
      if(!this.url) this.url = options.url;
      this.customQuery = options.filter || {};
    },
    buildQuery: function() {
      return _.assign({}, this.customQuery);
    },
    buildQueryParams: function() {
      return _.isEmpty(this.options) ? '' : Object.entries(this.options).reduce((q,[k,v]) => `${q}${k}=${JSON.stringify(v)}&`, '?');
    },
    fetch: async function(options = {}) {
      const _fetch = (url, memo = []) => {
        return new Promise((resolve, reject) => {
          Backbone.Collection.prototype.fetch.call(this, _.assign({
            url,
            method: 'POST',
            data: this.buildQuery(),
            success: async (d, status, res) => {
              memo.push(...d.models);
              const link = res.xhr.getResponseHeader('Link');
              if(link) {
                const nextUrl = link.match(/<(.+)>; rel="next",/)[1];
                if(nextUrl) return resolve(_fetch(nextUrl, memo));
              }
              resolve(memo);
            }, 
            error: console.log
          }, options));
        });
      };
      this.reset(await _fetch(`${this.url}/query${this.buildQueryParams()}`));
    }
  });

  return ApiCollection;
});
