(function() {

  const isProduction = (window.AAT_BUILD_TYPE !== 'development');

  function loadScript(url, callback) {
    if (!url || typeof url !== 'string') return;
    const script = document.createElement('script');
    script.onload = callback;
    script.src = url;
    document.getElementsByTagName('head')[0].appendChild(script);
  };

  // 0. Keep loadScript code to add into Adapt API later
  window.__loadScript = loadScript;

  // 2. Setup require for old-style module declarations (some code still uses these), configure paths then load JQuery
  function setupRequireJS() {
    requirejs.config({
      baseUrl: '.',
      paths: {
        backbone: 'libraries/backbone.min',
        'backbone.controller': 'libraries/backbone.controller',
        'backbone.es6': 'libraries/backbone.es6',
        backboneForms: 'libraries/backbone-forms',
        backboneFormsLists: 'libraries/backbone-forms-lists',
        bowser: 'libraries/bowser',
        ckeditor: 'libraries/ckeditor',
        'core-js': 'libraries/core-js.min',
        handlebars: 'libraries/handlebars.min',
        imageReady: 'libraries/imageReady',
        inview: 'libraries/inview',
        jquery: 'libraries/jquery.min',
        jqueryForm: 'libraries/jquery.form',
        jqueryTagsInput: 'libraries/jquery.tagsinput.min',
        jqueryUI: 'libraries/jquery-ui.min',
        moment: 'libraries/moment.min',
        polyglot: 'libraries/polyglot.min',
        react: isProduction ? 'libraries/react.production.min' : 'libraries/react.development',
        'react-dom': isProduction ? 'libraries/react-dom.production.min' : 'libraries/react-dom.development',
        'regenerator-runtime': 'libraries/regenerator-runtime.min',
        scrollTo: 'libraries/scrollTo.min',
        selectize: 'libraries/selectize/js/selectize',
        underscore: 'libraries/underscore.min',
        velocity: 'libraries/velocity'
      },
      map: {
        '*': {
          "core": "adapt-authoring-ui/app/core",
          "modules": "adapt-authoring-ui/app/modules"
        }
      },
      waitSeconds: 0
    });
    loadJQuery();
  }

  // 3. start loading JQuery, wait for it to be loaded
  function loadJQuery() {
    loadScript('libraries/jquery.min.js', checkJQueryStatus);
  }

  // 4. Wait until JQuery gets loaded completely then load foundation libraries
  function checkJQueryStatus() {
    if (window.jQuery === undefined) {
      setTimeout(checkJQueryStatus, 100);
    } else {
      setupModernizr();
    }
  }

  // 5. Backward compatibility for Modernizr
  function setupModernizr() {
    Modernizr.touch = Modernizr.touchevents;
    const touchClass = Modernizr.touch ? 'touch' : 'no-touch';
    $('html').addClass(touchClass);
    loadFoundationLibraries();
  }

  // 6. Load foundation libraries and templates then load Adapt itself
  function loadFoundationLibraries() {
    require([
      'handlebars',
      'underscore',
      'regenerator-runtime',
      'core-js',
      'backbone',
      'backbone.controller',
      'backbone.es6',
      'backboneForms',
      'backboneFormsLists',
      'imageReady',
      'inview',
      'jqueryForm',
      'jqueryTagsInput',
      'jqueryUI',
      'moment',
      'polyglot',
      'scrollTo',
      'selectize',
      'bowser',
      'react',
      'react-dom',
      'velocity'
    ], loadGlobals);
  }

  // 7. Expose global context libraries
  function loadGlobals(Handlebars, _) {
    window._ = _;
    window.Handlebars = Handlebars;
    /* require([
      'events/touch'
    ], loadTemplates); */
    loadTemplates();
  }

  // 8. Load templates
  function loadTemplates() {
    require([
      'templates'
    ], loadI10n);
  }

  // 8A. Load localisation
  function l10n(Polyglot) {
    let polyglot;
    return {
      load: function(callback) {
        try {
          const locale = localStorage.getItem('lang') || 'en';
          $.get({
            url: `/api/lang/${locale}`,
            success: function(data) {
              polyglot = new Polyglot({
                locale: locale,
                phrases: data,
                interpolation: { prefix: '${', suffix: '}' },
                warn: message => console.warn('l10n:', message)
              });
              callback();
            }
          })
        } catch(e) {
          console.error(e.message);
        }
      },
      t: function(string, data) {
        if(!polyglot || !polyglot.t) {
          return string;
        }
        return polyglot.t.apply(polyglot, arguments);
      },
      has: function() {
        if(!polyglot || !polyglot.has) {
          return false;
        }
        return polyglot.has.apply(polyglot, arguments);
      }
    };
  }

  function loadI10n() {
    require([
      'polyglot'
    ], function(Polyglot) {
      const localisationInstance = new l10n(Polyglot);
      localisationInstance.load(function() {
        window.l10n = localisationInstance;
        loadAdapt();
      });
    });
  }

  // 9. Allow cross-domain AJAX then load Adapt
  function loadAdapt() {
    $.ajaxPrefilter(function(options) {
      options.crossDomain = true;
    });
    loadScript('js/adapt.min.js');
  }

  // 1. Configure RequireJS
  setupRequireJS();

})();
