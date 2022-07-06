// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Handlebars = require('handlebars');
  var Origin = require('core/origin');

  var jsHelpers = {
    ajax: function(route, data, method, success) {
      $.ajax(route, {
        data: data,
        method: method,
        error: function({ responseText }, status, error) {
          Origin.Notify.alert({ 
            type: 'error', 
            text: error + (responseText ? `: ${responseText}` : '') 
          });
        },
        success: success
      });
    }
  };
  // accessible to Handlebars only!
  var hbsHelpers = {
    ifIsCurrentTenant: function(tenantId, block) {
      if (tenantId === Origin.sessionModel.get('tenantId')) {
        return block.fn(this);
      } else {
        return block.inverse(this);
      }
    },
    ifUserNotMe: function(userId, block) {
      if (userId !== Origin.sessionModel.get('user')._id) {
        return block.fn(this);
      } else {
        return block.inverse(this);
      }
    }
  };
  for(var name in hbsHelpers) {
    if(hbsHelpers.hasOwnProperty(name)) Handlebars.registerHelper(name, hbsHelpers[name]);
  }
  return jsHelpers;
});
