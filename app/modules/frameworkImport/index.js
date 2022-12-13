// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var FrameworkImportView = require('./views/frameworkImportView.js');
  var FrameworkImportSidebarView = require('./views/frameworkImportSidebarView.js');

  var featureScopes = ["import:adapt"];

  Origin.on('origin:dataReady login:changed', function init() {
    Origin.router.restrictRoute('frameworkImport', featureScopes);
    
    if(!Origin.sessionModel.hasScopes(featureScopes)) {
      return;
    }
    Origin.on('router:frameworkImport', renderMainView);
    Origin.on('dashboard:postRender', data => data.action !== 'edit' && renderPublishButton(data));
  });

  function renderPublishButton(data) {
    var $btn = $(Handlebars.partials.part_frameworkImportButton());
    $btn.click(() => Origin.router.navigateTo('frameworkImport'));
  }

  function renderMainView(location, subLocation, action) {
    Origin.contentPane.setView(FrameworkImportView, { model: new Backbone.Model({ globalData: data }) });
    Origin.sidebar.addView(new FrameworkImportSidebarView().$el);
  }
});