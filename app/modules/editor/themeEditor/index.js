// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var EditorThemingView = require('./views/editorThemingView.js');

  Origin.on('editorCommon:theme', function() {
    Origin.router.navigate(`#/editor/${Origin.editor.data.course.get('_id')}/${ROUTE}`, { trigger: true });
  });

  Origin.on('editor:selecttheme', () => {
    Origin.contentPane.setView(EditorThemingView);
  });
});
