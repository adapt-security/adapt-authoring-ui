// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(['core/utils'], function(Utils) {
  return function Constants(Origin) {
    // Read in the configuration values/constants
    Utils.get('/api/config', (error, data) => {
      if(error) {
        return console.error(error.message);
      }
      Origin.trigger('constants:loaded', data);
    });
  };
});
