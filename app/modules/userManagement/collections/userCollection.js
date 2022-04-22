define(function(require) {
  var Backbone = require('backbone');
  var UserModel = require('../models/userModel');

  var UserCollection = Backbone.Collection.extend({
    url: 'api/users',
    model: UserModel,
    sortBy: 'email',
    direction: 1,
    mailSearchTerm: '',
    lastAccess: null,

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

    updateFilter: function(filterMap = { roleNames: [] }) {
      this.filterGroups = filterMap;
      this.filter();
      this.sort();
    },

    filter: function() {
      this.models.forEach(function(model) { 
        this.mailFilter(model);
        this.roleFilter(model);
      }, this);
    },

    mailFilter: function(model) {
      var isHidden = model.get('email').toLowerCase().indexOf(this.mailSearchTerm.toLowerCase()) === -1;
      model.set('_isHidden', isHidden);
    },

    roleFilter: function(model) {
      if (model.get('_isHidden')) return;
      if (!this.filterGroups.roleNames || this.filterGroups.roleNames.length < 1) return;

      var isHidden = !(model.get('roles').some(function(r) {
        return this.filterGroups.roleNames.includes(r.get('shortName'));
      }, this));

      model.set('_isHidden', isHidden);
    }
  });

  return UserCollection;
});
