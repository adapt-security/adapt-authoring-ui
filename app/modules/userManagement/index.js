define(function(require) {
  var Origin = require('core/origin');
  var UserManagementView = require('./views/userManagementView');
  var UserManagementSidebarView = require('./views/userManagementSidebarView');
  var AddUserView = require('./views/addUserView');
  var AddUserSidebarView = require('./views/addUserSidebarView');
  var CustomHelpers = require('./helpers');
  var UserCollection = require('./collections/userCollection');

  var isReady = false;
  var allRoles = new Backbone.Collection();

  Origin.on('origin:dataReady login:changed', function() {
    var permissions = ["read:users"];

    Origin.router.restrictRoute('userManagement', permissions);
    
  	if (!Origin.sessionModel.hasScopes(permissions)) {
      isReady = true;
      return;
    }
    allRoles.on('sync', function() {
      isReady = true;
      Origin.trigger('userManagement:dataReady');
    });
    allRoles.url = 'api/roles';
    allRoles.fetch();

    Origin.globalMenu.addItem({
      "location": "global",
      "text": Origin.l10n.t('app.usermanagement'),
      "icon": "fa-users",
      "sortOrder": 3,
      "callbackEvent": "userManagement:open"
    });
  });

  Origin.on('globalMenu:userManagement:open', function() {
    Origin.router.navigateTo('userManagement');
  });

  Origin.on('router:userManagement', function(location, subLocation, action) {
    if(isReady) {
      return onRoute(location, subLocation, action);
    }
    Origin.once('userManagement:dataReady', function() {
      onRoute(location, subLocation, action);
    });
  });

  var onRoute = function(location, subLocation, action) {
    if (location && location === 'addUser') {
      Origin.contentPane.setView(AddUserView, { model: new Backbone.Model({ globalData: { allRoles: allRoles } }) });
      Origin.sidebar.addView(new AddUserSidebarView().$el);
      return;
    }
    var userCollection = new UserCollection();
    var globalModel = new Backbone.Model({ globalData: { allRoles: allRoles } });

    userCollection.once('sync', function() {
      Origin.contentPane.setView(UserManagementView, {
        model: globalModel,
        collection: userCollection
      });
      Origin.sidebar.addView(new UserManagementSidebarView({
        model: globalModel,
        collection: userCollection
      }).$el);
    });

    userCollection.fetch();
  };
});
