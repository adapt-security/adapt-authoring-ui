// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var EditorConfigModel = require('core/models/configModel');
  var EditorThemingView = require('./views/editorThemingView.js');
  var EditorThemingSidebarView = require('./views/editorThemingSidebarView.js');

  Origin.on('editorCommon:theme', function() {
    Origin.router.navigate('#/editor/' + Origin.editor.data.course.get('_id') + '/' + ROUTE, { trigger: true });
  });

  Origin.on('editor:selecttheme', function(route1, route2, route3, route4) {
    Origin.editor.data.config.fetch({
      success: function(configModel) {
        Origin.sidebar.addView(new EditorThemingSidebarView().$el);
        Origin.contentPane.setView(EditorThemingView, { model: configModel });
      }
    });
  });
});
