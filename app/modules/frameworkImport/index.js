// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var FrameworkImportView = require('./views/frameworkImportView.js');
  var FrameworkImportSidebarView = require('./views/frameworkImportSidebarView.js');

  var featureScopes = ["import:adapt"];
  var hasPermission = false;

  Origin.on('origin:dataReady login:changed', function init() {
    Origin.router.restrictRoute('frameworkImport', featureScopes);
    hasPermission = Origin.sessionModel.hasScopes(featureScopes);
  });

  Origin.on('router:frameworkImport', renderMainView);
  Origin.on('projects:postRender', data => hasPermission && data.action !== 'edit' && renderImportButton(data));

  function renderImportButton(data) {
    $('button.projects-sidebar-import-course').remove(); // remove existing button
    if(!hasPermission) {
      return;
    }
    var $btn = $(Handlebars.partials.part_frameworkImportButton());
    $('.projects-sidebar-add-course').after($btn);
    $btn.click(() => Origin.router.navigateTo('frameworkImport'));
  }

  function renderMainView(location, subLocation, action) {
    Origin.contentPane.setView(FrameworkImportView, { model: new Backbone.Model() });
    Origin.sidebar.addView(new FrameworkImportSidebarView().$el);
  }
});