// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var EditorThemingView = require('./views/editorThemingView.js');

  Origin.on('editor:selecttheme', () => {
    Origin.contentHeader.setButtons(Origin.contentHeader.BUTTON_TYPES.ACTIONS, [{ 
      items: [
        {
          id: 'save',
          buttonText: Origin.l10n.t('app.save')
        },
        {
          id: 'savepreset',
          buttonText: Origin.l10n.t('app.savepreset'),
          buttonClass: 'short secondary-hollow action-btn'
        },
        {
          id: 'restorepreset',
          buttonText: Origin.l10n.t('app.restorepreset'),
          buttonClass: 'short action-secondary'
        },
        {
          id: 'cancel',
          buttonText: Origin.l10n.t('app.cancel'),
          buttonClass: 'action-secondary'
        }
      ]
    }]);
    Origin.contentHeader.setTitle({
      breadcrumbs: ['course', { title: Origin.l10n.t('app.thememanagement') }],
      title: Origin.l10n.t('app.themingtitle')
    });
    Origin.contentPane.setView(EditorThemingView);
  });
});
