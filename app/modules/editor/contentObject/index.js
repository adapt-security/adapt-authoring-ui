// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var EditorView = require('../global/views/editorView');
  var Helpers = require('../global/helpers');
  var Origin = require('core/origin');

  Origin.on('editor:contentObject', function(data) {
    const model = data.id ? Origin.editor.data.content.findWhere({ _id: data.id }) : Origin.editor.data.course;
    Helpers.setPageTitle(model);
    const actionButtons = [
      {
        buttonText: Origin.l10n.t('app.preview'),
        eventName: 'preview'
      },
      {
        buttonText: Origin.l10n.t('app.download'),
        buttonClass: 'action-secondary',
        eventName: 'publish'
      }
    ];
    if(Origin.sessionModel.hasScopes(["export:adapt"])) {
      actionButtons.push({
        buttonText: Origin.l10n.t('app.export'),
        buttonClass: 'action-secondary',
        eventName: 'export'
      });
    }
    Origin.contentHeader.setButtons(Origin.contentHeader.BUTTON_TYPES.ACTIONS, [{ items: actionButtons }]);
    const baseURl = `editor/${Origin.editor.data.course.get('_id')}`;
    Origin.contentHeader.setButtons(Origin.contentHeader.BUTTON_TYPES.LINKS, [{ 
      items: [
        {
          buttonText: 'Project settings',
          buttonIcon: 'fa-folder-open',
          eventData: `${baseURl}/settings`
        },
        {
          buttonText: 'Configuration settings',
          buttonIcon: 'fa-cog',
          eventData: `${baseURl}/config`
        },
        {
          buttonText: 'Theme settings',
          buttonIcon: 'fa-paint-brush',
          eventData: `${baseURl}/selecttheme`
        },
        {
          buttonText: 'Menu picker',
          buttonIcon: 'fa-th-large',
          eventData: `${baseURl}/menusettings`
        },
        {
          buttonText: 'Manage extensions',
          buttonIcon: 'fa-cubes',
          eventData: `${baseURl}/extensions`
        }
      ] 
    }]);
    Origin.contentPane.setView(EditorView, {
      currentCourseId: Origin.location.route1,
      currentView: data.type,
      currentPageId: data.id
    }, { fullWidth: data.type === 'menu' });
  });
});
