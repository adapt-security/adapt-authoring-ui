// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var EditorExtensionsEditView = require('./views/editorExtensionsEditView');
  var Origin = require('core/origin');

  Origin.on('editor:extensions', function() {
    Origin.contentHeader.setTitle({
      breadcrumbs: ['course', { title: Origin.l10n.t('app.editorextensions') }],
      title: Origin.l10n.t('app.extensionstitle')
    });
    Origin.contentPane.setView(EditorExtensionsEditView, { model: Origin.editor.data.course });
  });
});