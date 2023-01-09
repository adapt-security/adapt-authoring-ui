// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var EditorThemingView = require('./views/editorThemingView.js');

  Origin.on('editor:selecttheme', () => Origin.contentPane.setView(EditorThemingView));
});
