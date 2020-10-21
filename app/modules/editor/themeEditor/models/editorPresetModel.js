// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var EditorModel = require('./editorModel');

  var EditorPresetModel = EditorModel.extend({ url: 'api/coursethemepresets' });

  return EditorPresetModel;
});
