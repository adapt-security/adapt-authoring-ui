// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function() {
  return async function Constants(Origin) {
    try { // Read in the configuration values/constants
      Origin.trigger('constants:loaded', await $.get('/api/config'));
    } catch(e) {
      console.error(error.message);
    }
  };
});
