// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var EditorExtensionsEditSidebarView = require('./views/editorExtensionsEditSidebarView');
  var EditorExtensionsEditView = require('./views/editorExtensionsEditView');
  var Origin = require('core/origin');

  Origin.on('editor:extensions', function() {
    Origin.trigger('contentHeader:updateTitle', {
      breadcrumbs: ['dashboard', 'course', { title: Origin.l10n.t('app.editorextensions') }],
      title: Origin.editor.data.course.get('title')
    });
    // Check whether the user came from the page editor or menu editor
    var backButtonRoute = `#/editor/${Origin.location.route1}/menu`;
    var backButtonText = Origin.l10n.t('app.backtomenu');
    if (Origin.previousLocation.route2 === "page") {
      backButtonRoute = `#/editor/${Origin.location.route1}/page/${Origin.previousLocation.route3}`;
      backButtonText = Origin.l10n.t('app.backtopage');
    }
    Origin.sidebar.addView(new EditorExtensionsEditSidebarView().$el, {
      backButtonText: backButtonText,
      backButtonRoute: backButtonRoute
    });
    Origin.contentPane.setView(EditorExtensionsEditView, { model: new Backbone.Model({ _id: Origin.location.route1 }) });
  });
});
