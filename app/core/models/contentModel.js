// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var ApiModel = require('./apiModel');

  var ContentAttributes = {
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

  var ContentModel = ApiModel.extend({
    initialize: function(attributes, options = {}) {
      options.endpoint = 'content';

      ApiModel.prototype.initialize.call(this, attributes, options);
      
      const typeAttributes = ContentAttributes[attributes._type];
      if(typeAttributes) Object.assign(this, typeAttributes);

      Origin.trigger('contentModel:created', this);

      this.on('sync destroy', () => Origin.editor && Origin.editor.data && Origin.editor.data.load())
    },
    // TODO added for convenience, shouldn't depend on Origin.editor.data
    getParent() {
      return Origin.editor && Origin.editor.data && Origin.editor.data.getParent(this);
    },
    getSiblings() {
      const children = Origin.editor && Origin.editor.data && Origin.editor.data.getChildren(this.getParent());
      return children.filter(s => s.get('_id') !== this.get('_id'));
    },
    getChildren() {
      return Origin.editor && Origin.editor.data && Origin.editor.data.getChildren(this);
    },
    getHierarchy() {
      const hierarchy = [this];
      let model = this;
      do {
        model = model.getParent();
        if(model) hierarchy.push(model);
      } while(model);
      return hierarchy.reverse();
    }
  });

  return ContentModel;
});
