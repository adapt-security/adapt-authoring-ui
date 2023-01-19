// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var ProjectsView = require('./views/projectsView');

  Origin.on('router:projects', function(location, subLocation, action) {
    Origin.trigger('editor:resetData');

    Origin.contentHeader.setButtons(Origin.contentHeader.BUTTON_TYPES.SORTS, [
      {
        items: [
          {
            id: 'title',
            buttonText: Origin.l10n.t('app.title')
          },
          {
            id: 'updatedAt',
            buttonText: Origin.l10n.t('app.lastupdated')
          }
        ]
      }
    ]);
    Origin.contentHeader.setButtons(Origin.contentHeader.BUTTON_TYPES.FILTERS, [
      {
        name: 'Author',
        id: 'author',
        items: [
          {
            id: 'mine',
            type: 'toggle',
            buttonText: Origin.l10n.t('app.myprojects'),
            checked: true
          },
          {
            id: 'shared',
            type: 'toggle',
            buttonText: Origin.l10n.t('app.sharedprojects'),
            checked: true
          }
        ]
      },
      {
        items: [
          {
            id: 'search',
            type: 'search',
            buttonText: Origin.l10n.t('app.search'),
            placeholder: Origin.l10n.t('app.searchbyname')
          },
          {
            id: 'tags',
            type: 'tags',
            buttonText: Origin.l10n.t('app.tags'),
          },
          {
            id: 'pageSize',
            type: 'select',
            buttonText: Origin.l10n.t('app.pagesize'),
            values: [25,50,75,100]
          }
        ]
      }
    ]);
    const actionButtons = [{
      id: 'createcourse',
      buttonText: Origin.l10n.t('app.addnewproject')
    }];
    if(Origin.sessionModel.hasScopes(["import:adapt"])) {
      actionButtons.push({
        id: 'importcourse',
        buttonText: Origin.l10n.t('app.importcourse'),
        buttonClass: 'action-secondary'
      });
    }
    Origin.contentHeader.setButtons(Origin.contentHeader.BUTTON_TYPES.ACTIONS, [{ items: actionButtons }]);
    
    Origin.contentHeader.setTitle({
      breadcrumbs: ['dashboard'], 
      title: Origin.l10n.t(`app.projects`) 
    });
    Origin.contentPane.setView(ProjectsView, {}, { fullWidth: true });
  });

  Origin.on('router:initialize login:changed', function() {
    Origin.router.addDashboardHandler(() => {
      if(Origin.sessionModel.hasScopes(['read:content'])) return 'projects';
    });
  });
});
