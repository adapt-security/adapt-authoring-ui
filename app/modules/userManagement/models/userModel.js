// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/origin');

  var UserModel = Backbone.Model.extend({
    idAttribute: '_id',
    url: () =>  `api/users/${!this.isNew() ? this.id : ''}`,

    initialize: function() {
      this.on('change:globalData change:roles', this.setRoleNames);
    },
    // pull the human-readable role names from the list of all roles
    setRoleNames: function(model) {
      if(!model.get('globalData')) {
        return;
      }
      const roles = model.get('roles');
      const allRoles = model.get('globalData').allRoles;
      var roleNames;
      if(typeof roles === 'object') { // array
        roleNames = roles.map(role => allRoles.findWhere({ _id: role._id || role }).get('name'));
      } else { // string
        roleNames = allRoles.findWhere({ _id: roles }).get('name');
      }
      model.set('roleNames', roleNames);
    }
  });

  return UserModel;
});
