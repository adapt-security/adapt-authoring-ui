// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var ContentModel = require('./contentModel');

  var CourseModel = ContentModel.extend({
    _type: 'course',
    _childTypes: 'contentobject'
  });

  return CourseModel;
});
