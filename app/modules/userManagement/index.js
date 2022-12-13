define(function(require) {
  var Origin = require('core/origin');
  var UserManagementView = require('./views/userManagementView');
  var UserManagementSidebarView = require('./views/userManagementSidebarView');
  var AddUserView = require('./views/addUserView');
  var AddUserSidebarView = require('./views/addUserSidebarView');
  var UserCollection = require('./collections/userCollection');

  var isReady = false;
  var allRoles = new Backbone.Collection();
  var userCollection = new UserCollection();

  var scopes = ["write:users"];

  Origin.on('router:initialize', () => Origin.router.restrictRoute('userManagement', scopes));
  
  Origin.globalMenu.addItem({
    location: "global",
    text: Origin.l10n.t('app.usermanagement'),
    icon: "fa-users",
    sortOrder: 3,
    route: "userManagement",
    scopes
  });

  Origin.on('origin:dataReady login:changed', function() {
    allRoles.on('sync', function() {
      isReady = true;
      Origin.trigger('userManagement:dataReady');
    });
    allRoles.url = 'api/roles';
    allRoles.fetch();
  });
  

  Origin.on('router:userManagement', function(location, subLocation, action) {
    if(isReady) return onRoute(location, subLocation, action);
    Origin.once('userManagement:dataReady', () => onRoute(location, subLocation, action));
  });

  var onRoute = async function(location, subLocation, action) {
    var model = new Backbone.Model({ allRoles });

    if (location && location === 'addUser') {
      Origin.contentPane.setView(AddUserView, { model: model });
      Origin.sidebar.addView(new AddUserSidebarView().$el);
      return;
    }
    await refreshUsers();

    Origin.contentPane.setView(UserManagementView, { model, collection: userCollection });
    Origin.sidebar.addView(new UserManagementSidebarView({ model, collection: userCollection }).$el);
    
    Origin.on('userManagement:refresh', refreshUsers);
  };
  
  async function refreshUsers() {
    try {
      await userCollection.fetch();
      userCollection.forEach(user => user.set({ allRoles }));
    } catch(e) {
      Origin.Notify.alert({ type: 'error', message: e });
    }
  }
});
