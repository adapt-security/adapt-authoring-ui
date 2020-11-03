define(function(require) {
  var Backbone = require('backbone');
  var UserModel = require('../models/userModel');

  var UserCollection = Backbone.Collection.extend({
    url: 'api/users',
    model: UserModel,
    sortBy: 'email',
    direction: 1,
    mailSearchTerm: false,
    lastAccess: null,

    initialize: function() {
      this.filterGroups = { roleNames: [] };
    },

    comparator: function(ma, mb) {
      var a = ma.get(this.sortBy);
      var b = mb.get(this.sortBy);

      if (Array.isArray(a) && Array.isArray(b)) {
        a = a[0];
        b = b[0];
      }

      if (this.sortBy === 'lastAccess') {
        a = new Date(a || '01.01.1900');
        b = new Date(b || '01.01.1900');
      }

      if (typeof a === 'string' && typeof b === 'string') {
        a = a.toLowerCase();
        b = b.toLowerCase();
      }

      if (a > b) return this.direction;
      if (a < b) return this.direction * -1;
      return 0;
    },

    updateFilter: function(filterMap) {
      this.filterGroups = filterMap;
      this.sortCollection();
    },

    sortCollection: function() {
      this.resetHidden();
      this.filter();
      this.searchByMail();
      this.sort();
    },

    filter: function() {
      this.models.forEach(function(model) {
        this.filterRoleNames(model);
      }, this);
    },

    filterRoleNames: function(model) {
      var roleNames = this.filterGroups.roleNames;
      var userRoles = model.get('roleNames');
      if (roleNames && roleNames.indexOf(userRoles && userRoles[0]) < 0) {
        model.set('_isHidden', true);
      }
    },

    resetHidden: function() {
      this.forEach(function(model) {
        model.set('_isHidden', false);
      });
    },

    searchByMail: function() {
      this.models.forEach(function(model) {
        var mail = model.get('email').toLowerCase();
        model.set('_isHidden', mail.indexOf(this.mailSearchTerm) === -1);
      }, this);
    }

  });

  return UserCollection;

});
