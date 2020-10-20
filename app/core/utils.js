// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  return {
    post: (endpoint, data, cb) => {
      $.post(endpoint, data)
        .done(data => cb(null, data))
        .fail(jqXhr => cb(jqXhr.responseJSON));
    },
    get: (endpoint, cb) => {
      $.get(endpoint)
        .done(data => cb(null, data))
        .fail(jqXhr => cb(jqXhr.responseJSON));
    }
  };
});