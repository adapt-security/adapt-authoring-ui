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
            buttonText: 'Title',
            id: 'title'
          },
          {
            buttonText: 'Last updated',
            id: 'updatedAt'
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
            type: 'toggle',
            buttonText: Origin.l10n.t('app.myprojects'),
            checked: true,
            id: 'mine'
          },
          {
            type: 'toggle',
            buttonText: Origin.l10n.t('app.sharedprojects'),
            checked: true,
            id: 'shared'
          }
        ]
      },
      {
        items: [
          {
            type: 'search',
            buttonText: Origin.l10n.t('app.search'),
            placeholder: Origin.l10n.t('app.searchbyname'),
            id: 'search'
          },
          {
            type: 'tags',
            buttonText: Origin.l10n.t('app.tags'),
            id: 'tags'
          }
        ]
      }
    ]);

    const actionButtons = [{
      buttonText: Origin.l10n.t('app.addnewproject'),
      id: 'createcourse'
    }];
    if(Origin.sessionModel.hasScopes(["import:adapt"])) {
      actionButtons.push({
        buttonText: Origin.l10n.t('app.importcourse'),
        buttonClass: 'action-secondary',
        id: 'importcourse'
      });
    }
    Origin.contentHeader.setButtons(Origin.contentHeader.BUTTON_TYPES.ACTIONS, [{ items: actionButtons }]);
    
    Origin.trigger('contentHeader:updateTitle', { 
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
