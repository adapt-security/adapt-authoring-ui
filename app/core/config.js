// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
require.config({
  paths: {
    backbone: 'libraries/backbone',
    backboneForms: 'libraries/backbone-forms',
    backboneFormsLists: 'libraries/backbone-forms-lists',
    handlebars: 'libraries/handlebars',
    imageReady: 'libraries/imageReady',
    inview: 'libraries/inview',
    jquery: 'libraries/jquery',
    jqueryForm : 'libraries/jquery.form',
    jqueryTagsInput: 'libraries/jquery.tagsinput.min',
    jqueryUI: 'libraries/jquery-ui.min',
    moment: 'libraries/moment.min',
    polyfill: 'libraries/babel-polyfill.min',
    polyglot: 'libraries/polyglot.min',
    scrollTo: 'libraries/scrollTo',
    selectize: 'libraries/selectize/js/selectize',
    underscore: 'libraries/underscore',
    velocity: 'libraries/velocity',
    // auto-generate bundles
    'modules/modules': 'modules-bundle',
    'plugins/plugins': 'plugins-bundle',
    'templates/templates': 'templates'
  },
  shim: {
    // third-party
    backbone: {
      deps: ['underscore','jquery'],
      exports: 'Backbone'
    },
    backboneForms: {
      deps: ['backbone']
    },
    backboneFormsLists: {
      deps: ['backboneForms']
    },
    handlebars: {
      exports: 'Handlebars'
    },
    imageReady: {
      deps: ['jquery'],
      exports: 'imageready'
    },
    inview: {
      deps: ['jquery'],
      exports: 'inview'
    },
    jqueryForm: {
      deps: ['jquery'],
      exports: "$"
    },
    jqueryTagsInput: {
      deps: ['jquery'],
      exports: "$"
    },
    jqueryUI: {
      deps: ['jquery'],
      exports: "$"
    },
    moment: {
      exports: 'moment'
    },
    polyglot: {
      exports: 'Polyglot'
    },
    scrollTo: {
      deps: ['jquery'],
      exports: 'scrollTo'
    },
    selectize: {
      deps: ['jquery'],
      exports: "$"
    },
    underscore: {
      exports: '_'
    },
    velocity: {
      deps: ['jquery'],
      exports: 'velocity'
    },
    // internal
    'templates/templates': {
      deps:['handlebars']
    }
  },
  waitSeconds: 0
});
