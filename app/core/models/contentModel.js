// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var ApiModel = require('./apiModel');

  var ContentModel = ApiModel.extend({
    initialize: function(attributes, options = {}) {
      options.endpoint = 'content';

      ApiModel.prototype.initialize.call(this, attributes, options);
      
      const typeAttributes = ContentAttributes[attributes._type];
      if(typeAttributes) Object.assign(this, typeAttributes);
    },
    // TODO added for convenience, shouldn't depend on Origin.editor.data
    get parent() {
      return Origin.editor.data.getParent(this.model);
    },
    get siblings() {
      return Origin.editor.data.getChildren(this.parent);
    },
    get children() {
      return Origin.editor.data.getChildren(this.model);
    },
  });

  return ContentModel;
});

const ContentAttributes = {
  article: {
    _type: 'article',
    _parentType: 'contentobject',
    _siblingTypes: 'article',
    _childTypes: 'block',
    defaults: {
      _isCollapsible: true,
      _isCollapsed: false
    }
  },
  block: {
    _type: 'block',
    _parentType: 'article',
    _siblingTypes: 'block',
    _childTypes: 'component',
    layoutOptions:  null,
    dragLayoutOptions: null
  },
  component: {
    _type: 'component',
    _parentType: 'block',
    _siblingTypes: 'component'
  },
  config: {
    _type: 'config',
    _parent: 'course'
  },
  contentObject: {
    _type: 'contentobject',
    _parentType: 'contentobject',
    _siblingTypes: 'contentobject',
    _childTypes: ['contentobject', 'article'],
    defaults: {
      _isSelected: false,
      _isExpanded: false
    }
  },
  course: {
    _type: 'course',
    _childTypes: 'contentobject'
  }
};