define(function(require) {
  var Origin = require('core/origin');
  var UserManagementView = require('./views/userManagementView');
  var AddUserView = require('./views/addUserView');
  var UserCollection = require('./collections/userCollection');

  var isReady = false;
  var allRoles = new Backbone.Collection();
  var userCollection = new UserCollection();

  var scopes = ["write:users"];

  Origin.on('router:initialize', () => Origin.router.restrictRoute('userManagement', scopes));
  
  Origin.on('origin:dataReady', () => {
    Origin.globalMenu.addItem({
      location: "global",
      text: Origin.l10n.t('app.usermanagement'),
      icon: "fa-users",
      sortOrder: 3,
      route: "userManagement",
      scopes
    });
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
      Origin.trigger('contentHeader:updateTitle', { breadcrumbs: [{ title: Origin.l10n.t('app.usermanagement'), url: '#' }], title: Origin.l10n.t('app.addnewuser') });
      Origin.contentHeader.setButtons(Origin.contentHeader.BUTTON_TYPES.ACTIONS, Origin.contentHeader.ACTION_BUTTON_TEMPLATES.EDIT_FORM);
      Origin.contentPane.setView(AddUserView, { model: model });
      return;
    }
    await refreshUsers();

    Origin.contentHeader.setButtons(Origin.contentHeader.BUTTON_TYPES.FILTERS, [
      {
        id: 'role',
        items: [
          {
            id: 'contentcreator',
            type: 'toggle',
            buttonText: 'Content creators',
            checked: true
          },
          {
            id: 'authuser',
            type: 'toggle',
            buttonText: 'Authenticated users',
            checked: true
          },
          {
            id: 'superuser',
            type: 'toggle',
            buttonText: 'Super users',
            checked: true
          },
          {
            id: 'contenteditor',
            type: 'toggle',
            buttonText: 'Content Editors',
            checked: true
          },
          {
            id: 'contentreviewer',
            type: 'toggle',
            buttonText: 'Content Reviewers',
            checked: true
          }
        ]
      },
      {
        name: Origin.l10n.t('app.search'),
        items: [
          {
            id: 'search',
            type: 'search',
            placeholder: Origin.l10n.t('app.searchbyemail')
          }
        ]
      }
    ]);
    Origin.contentHeader.setButtons(Origin.contentHeader.BUTTON_TYPES.ACTIONS, [{
      items: [{
        id: 'adduser',
        buttonText: Origin.l10n.t('app.addnewuser')
      }]
    }]);
    Origin.trigger('contentHeader:updateTitle', { breadcrumbs: [{ title: Origin.l10n.t('app.usermanagement'), url: '#' }], title: Origin.l10n.t('app.usermanagementtitle') });

    Origin.contentPane.setView(UserManagementView, { model, collection: userCollection }, { fullWidth: true });

    Origin.on('actions:adduser', () => Origin.router.navigateTo('userManagement/addUser'));
    
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
