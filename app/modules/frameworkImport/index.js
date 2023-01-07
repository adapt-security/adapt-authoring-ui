// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var FrameworkImportView = require('./views/frameworkImportView.js');

  var featureScopes = ["import:adapt"];

  Origin.on('origin:dataReady login:changed', function init() {
    Origin.router.restrictRoute('frameworkImport', featureScopes);
    
    if(!Origin.sessionModel.hasScopes(featureScopes)) {
      return;
    }
    Origin.on('router:frameworkImport', renderMainView);
  });

  function renderMainView(location, subLocation, action) {
    Origin.contentHeader.setButtons(Origin.contentHeader.BUTTON_TYPES.ACTIONS, [{
      items: [
        {
          buttonText: Origin.l10n.t('app.importcourse'),
          buttonClass: 'action-primary import display-none',
          eventName: 'import'
        },
        {
          buttonText: Origin.l10n.t('app.checkimport'),
          buttonClass: 'action-tertiary check',
          eventName: 'check'
        },
        {
          buttonText: Origin.l10n.t('app.cancel'),
          buttonClass: 'action-secondary',
          eventName: 'cancel'
        }
      ]
    }]);
    Origin.contentPane.setView(FrameworkImportView, { model: new Backbone.Model() });
  }
});