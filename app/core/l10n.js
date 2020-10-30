// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(['polyglot', 'core/utils'], function(Polyglot, Utils) {
  return function l10n(Origin) {
    var polyglot;
    /**
    * Initialise from language file
    */
    var locale = localStorage.getItem('lang') || 'en';
    Utils.get('/api/lang/' + locale, function (error, data) {
      if(error) {
        return console.error(error.message);
      }
      polyglot = new Polyglot({
        locale: locale,
        phrases: data,
        warn: function(message) {
          if(Origin.debug) console.warn('l10n:', message);
        }
      });
      Origin.trigger('l10n:loaded');
    });
    return {
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
  };
});
