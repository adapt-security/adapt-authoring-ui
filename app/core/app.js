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
      'scrollTo',
      'selectize',
      'velocity'
    ], Handlebars => {
      window.Handlebars = $.extend(Handlebars, window.Handlebars);
      callback();
    });
  }

  function loadCore(callback) {
    require([
      'templates/templates',
      'core/origin',
      'core/helpers',
    ], (Templates, Origin) => callback(Origin));
  }

  function loadExtras(callback) {
    require(['modules/modules', 'plugins/plugins'], callback);
  }
  /**
   * Start app load
   */
  loadLibraries(() => {
    loadCore(Origin => {
      Origin.startSession(error => {
        if(error) console.error(error);
        loadExtras(() => Origin.initialize());
      });
    });
  });
})();