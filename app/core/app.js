// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
(function() {
  function loadLibraries(callback) {
    require([
      'handlebars',
      'imageReady',
      'inview',
      'jqueryForm',
      'jqueryTagsInput',
      'jqueryUI',
      'polyfill',
      'scrollTo',
      'selectize',
      'sweetalert',
      'velocity'
    ], function(Handlebars) {
      window.Handlebars = $.extend(Handlebars, window.Handlebars);
      callback();
    });
  }

  function loadCore(callback) {
    require([
      'templates/templates',
      'core/origin',
      'core/helpers',
    ], function(Templates, Origin) {
      callback(Origin);
    });
  }

  function loadExtras(callback) {
    require(['modules/modules', 'plugins/plugins'], callback);
  }
  /**
   * Start app load
   */
  loadLibraries(function() {
    loadCore(function(Origin) {
      Origin.startSession(function() {
        loadExtras(function() {
          Origin.initialize();
        });
      });
    });
  });
})();