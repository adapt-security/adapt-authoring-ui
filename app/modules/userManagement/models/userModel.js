// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/origin');

  var UserModel = Backbone.Model.extend({
    idAttribute: '_id',
    url: function() {
      return `api/users/${!this.isNew() ? this.id : ''}`;
    },

    initialize: function() {
      this.on('change:allRoles change:roles', this.setRoleNames);
    },
    // pull the human-readable role names from the list of all roles
    setRoleNames: function(model) {
      if(!model.get('allRoles')) return;
      const roles = model.get('roles');
      const allRoles = model.get('allRoles');
      let roleNames;
      if(typeof roles === 'object') { // array
        roleNames = roles.map(role => {
          const roleId = (typeof role === 'string') ? role : role.get('_id');
          return allRoles.findWhere({ _id: roleId });
        });
      } else { // string
        roleNames = allRoles.findWhere({ _id: roles });
      }
      model.set('roles', roleNames);
    }
  });

  return UserModel;
});
