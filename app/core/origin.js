// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define([
  'underscore', 
  'backbone', 
  'core/l10n',
  'core/router',
  'core/models/sessionModel'
], function(_, Backbone, l10n, Router, SessionModel) {
  var initialized = false;
  var eventTaps = [];
  var $loading;

  var Origin = _.extend({}, Backbone.Events, {
    debug: false,
    /**
    * Performs the necessary set-up steps
    */
    initialize: _.once(function(callback) {
      listenToWindowEvents();
      new Router(this);
      initialized = true;
      this.trigger('origin:dataReady');
    }),
    
    loadUtilities: _.once(async function(callback) {
      try {
        this.constants = await $.get('/api/config');
        this.l10n = new l10n(this);
        await this.l10n.load();
        callback();
      } catch(e) {
        console.error(e.message);
      }
    }),
    /**
     * Saves session on the Origin object
     */
    startSession: _.once(function(callback) {
      initLoading();
      this.loadUtilities((function() {
        Origin.sessionModel = new SessionModel(this);
        Origin.sessionModel.fetch({
          success: () => callback(),
          error: (m, jqXhr) => callback(new Error(jqXhr.responseJSON.message))
        });
      }).bind(this));
    }),
    /**
    * Whether the Origin object has loaded
    */
    hasInitialized: function() {
      return initialized;
    },
    /**
    * Override to allow for tapping and debug logging
    * TODO this is probably very inefficient, look into this
    */
    trigger: function(eventName, data) {
      var args = arguments;
      callTaps(eventName, function() {
        if(Origin.debug){
          console.log('Origin.trigger:', eventName, (data ? data : ''));
        }
        Backbone.Events.trigger.apply(Origin, args);
      });
    },
    /**
    * Register a function to tap into a certain event before it fires
    */
    tap: function(event, callback) {
      eventTaps.push({ event: event, callback: callback });
    },
    /**
    * Tells views to clean themselves up
    */
    removeViews: function() {
      Origin.trigger('remove:views');
    }
  });

  /**
  * Private functions
  */

  function initLoading() {
    $loading = $('.loading');
    hideLoading();

    Origin.on('origin:hideLoading', hideLoading, Origin);
    Origin.on('origin:showLoading', showLoading, Origin);
  }

  // abstracted window events
  function listenToWindowEvents() {
    $(document).on('keydown', onKeyDown);
    $(window).on('resize', onResize);
    $(window).on('blur focus', onFocusBlur);
  }

  function showLoading(shouldHideTopBar) {
    $loading
      .removeClass('display-none fade-out')
      .toggleClass('cover-top-bar', shouldHideTopBar);
  }

  function hideLoading() {
    $loading.addClass('fade-out');
    _.delay(_.bind(function() {
      $loading
        .addClass('display-none')
        .removeClass('cover-top-bar');
    }, this), 300);
  }

  /**
  * Calls all 'tapped' functions before continuing
  */
  function callTaps(event, callback) {
    var taps = _.where(eventTaps, { event: event });
    // recurse
    function callTap() {
      var tap = taps.pop();
      if(!tap) return callback();
      tap.callback.call(Origin, callTap);
    }
    callTap();
  }

  /**
  * Event handling
  */

  function onKeyDown(event) {
    if($(event.target).is('input, textarea')) return;
    Origin.trigger('key:down', event);
  }

  function onResize(event) {
    var $window = $(this);
    var windowWidth = $window.width();
    var windowHeight = $window.height();
    Origin.trigger('window:resize', windowWidth, windowHeight);
  }

  function onFocusBlur(event) {
    var $win = $('window');
    var prevType = $win.data("prevType");
    // prevent double-firing
    if(prevType === event.type) return;
    // send out Origin events
    var eventName = (event.type === 'focus') ? 'active' : 'inactive';
    Origin.trigger('window:' + eventName, event);
  }

  return Origin;
});
