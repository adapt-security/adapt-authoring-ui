// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(['polyglot'], function(Polyglot) {
  return function l10n(Origin) {
    let polyglot;
    return {
      load: async function() {
        try {
          const locale = localStorage.getItem('lang') || 'en';
          polyglot = new Polyglot({
            locale: locale,
            phrases: await $.get(`/api/lang/${locale}`),
            warn: message => Origin.debug && console.warn('l10n:', message)
          });
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
  };
});
