define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/origin');
  var UserManagementView = require('./views/userManagementView');
  var AddUserView = require('./views/addUserView');

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

  Origin.on('router:userManagement', function(location, subLocation, action) {
    location === 'addUser' ? renderAddUser() : renderUserManagement();
  });

  function renderAddUser() {
    Origin.contentHeader.setTitle({ 
      breadcrumbs: [{ title: Origin.l10n.t('app.usermanagement'), url: '#' }], 
      title: Origin.l10n.t('app.addnewuser') 
    });
    Origin.contentHeader.setButtons(Origin.contentHeader.BUTTON_TYPES.ACTIONS, Origin.contentHeader.ACTION_BUTTON_TEMPLATES.EDIT_FORM);
    Origin.contentPane.setView(AddUserView, { model: new Backbone.Model() });
  }

  function renderUserManagement() {
    Origin.contentHeader.setButtons(Origin.contentHeader.BUTTON_TYPES.FILTERS, [
      {
        name: Origin.l10n.t('app.search'),
        items: [
          {
            id: 'search',
            type: 'search',
            placeholder: Origin.l10n.t('app.searchbyemail')
          }
        ]
      },
      {
        items: [
          {
            id: 'isLocked',
            buttonText: Origin.l10n.t('app.accountlocked'),
            type: 'toggle'
          }
        ]
      },
      {
        id: 'role',
        items: [
          {
            id: 'contentcreator',
            type: 'toggle',
            buttonText: Origin.l10n.t('app.contentcreators'),
            checked: true
          },
          {
            id: 'authuser',
            type: 'toggle',
            buttonText: Origin.l10n.t('app.authusers'),
            checked: true
          },
          {
            id: 'superuser',
            type: 'toggle',
            buttonText: Origin.l10n.t('app.superusers'),
            checked: true
          },
          {
            id: 'contenteditor',
            type: 'toggle',
            buttonText: Origin.l10n.t('app.contenteditors'),
            checked: true
          },
          {
            id: 'contentreviewer',
            type: 'toggle',
            buttonText: Origin.l10n.t('app.contentreviewers'),
            checked: true
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
    Origin.contentHeader.setTitle({ title: Origin.l10n.t('app.usermanagementtitle') });
    Origin.contentPane.setView(UserManagementView, {}, { fullWidth: true });
    Origin.on('actions:adduser', () => Origin.router.navigateTo('userManagement/addUser'));
  }
});
