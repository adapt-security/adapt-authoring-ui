// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var ContentModel = require('./contentModel');

  var ContentObjectModel = ContentModel.extend({
    _type: 'contentobject',
    _parentType: 'contentobject',
    _siblingTypes: 'contentobject',
    _childTypes: ['contentobject', 'article'],

    defaults: {
      _isSelected: false,
      _isExpanded: false
    }
  });

  return ContentObjectModel;
});
