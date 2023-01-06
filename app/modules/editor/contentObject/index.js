// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var EditorView = require('../global/views/editorView');
  var Helpers = require('../global/helpers');
  var Origin = require('core/origin');

  Origin.on('editor:contentObject', function(data) {
    const model = data.id ? Origin.editor.data.content.findWhere({ _id: data.id }) : Origin.editor.data.course;
    Helpers.setPageTitle(model);
    Origin.contentPane.setView(EditorView, {
      currentCourseId: Origin.location.route1,
      currentView: data.type,
      currentPageId: data.id
    });
  });
});
