// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var ApiCollection = require('core/collections/apiCollection');
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');
  var UserView = require('../views/userView');

  var UserManagementView = OriginView.extend({
    className: 'userManagement',
    events: {
      'click button[data-sort]': 'onSort'
    },

    initialize: function() {
      OriginView.prototype.initialize.apply(this, arguments);
      Origin.contentHeader.setTitle({ title: Origin.l10n.t('app.usermanagementtitle') });
      this.users = new ApiCollection([], { url: 'api/users' });
      this.roles = new ApiCollection([], { url: 'api/roles' });

      this.listenTo(this.users, 'sync', this.renderUsers);
      this.listenTo(Origin, 'filters', this.onFilter);
      
      this.fetch();
    },

    fetch: async function() {
      this.users.fetch();
      this.roles.fetch();
    },

    renderUsers: function() {
      this.$('.users').empty();
      this.users.each(user => this.$('.users').append(new UserView({ model: user.set('allRoles', this.roles) }).$el), this);
    },

    onFilter: function(filters) {
      const filterQuery = {};

      if(filters.isLocked) {
        filterQuery.$or = [{ isTempLocked: true }, { isPermLocked: true }];
      }
      if(filters.search) {
        filterQuery.email = {  $regex: `.*${filters.search.toLowerCase()}.*`, $options: 'i' };
      }
      if(filters.role) {
        filterQuery.role = {
          $in: Object.entries(filters.role)
            .filter(([role, show]) => show)
            .map(([role]) => this.roles.findWhere({ shortName: role }).get('_id'))
        };
      }
      this.users.customQuery = filterQuery;
      this.fetch();
    },

    onSort: function(event) {
      var $target = $(event.currentTarget);
      var sortAscending = $target.hasClass('sort-down');

      if ($target.hasClass('active')) {
        sortAscending = !sortAscending;
      }
      this.$('.sort').removeClass('active sort-up').addClass('sort-down');

      $target.addClass('active');
      $target.toggleClass('sort-down', sortAscending);
      $target.toggleClass('sort-up', !sortAscending);

      this.users.queryOptions.sort = { [$target.data('sort')]: sortAscending ? 1 : -1 };
      this.fetch();
    }
  }, {
    template: 'userManagement'
  });

  return UserManagementView;
});
