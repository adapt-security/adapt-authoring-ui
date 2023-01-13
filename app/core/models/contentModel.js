// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var ApiModel = require('./apiModel');

  var ContentModel = ApiModel.extend({
    constructor: function(attributes, options) {
      options.endpoint = 'content';
      ApiModel.prototype.constructor.call(this, attributes, options);
    },

    initialize: function() {
      if(!this.get('_type')) this.set('_type', this._type);
      if(this.get('_type') === 'article') {
        this.set('_isCollapsible', true);
      }
    }
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
    // Block specific properties
    layoutOptions:  null,
    dragLayoutOptions: null,
    attributeBlacklist: [
      '_isDeleted',
      '_tenantId',
      '_trackingId',
      'createdBy',
      'createdAt',
      'layoutOptions',
      'updatedAt'
    ]
  },
  component: {
    _type: 'component',
    _parentType: 'block',
    _siblingTypes: 'component',
    attributeBlacklist: [
      '_isDeleted',
      'createdBy',
      'createdAt',
      'updatedAt'
    ]
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