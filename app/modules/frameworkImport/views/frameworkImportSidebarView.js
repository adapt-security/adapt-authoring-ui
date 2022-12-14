// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var SidebarItemView = require('modules/sidebar/views/sidebarItemView');

  var FrameworkImportSidebarView = SidebarItemView.extend({
    events: {
      'click button.frameworkimport-check': 'check',
      'click button.frameworkimport-import': 'import',
      'click button.cancel': 'goBack'
    },

    check: function(event) {
      event && event.preventDefault();
      Origin.trigger('frameworkImport:check');
    },

    import: function(event) {
      event && event.preventDefault();
      Origin.trigger('frameworkImport:import');
    },

    goBack: function(event) {
      event && event.preventDefault();
      Origin.router.navigateToDashboard();
    }
  }, {
    template: 'frameworkImportSidebar'
  });
  return FrameworkImportSidebarView;
});
