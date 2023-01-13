// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var ContentModel = require('core/models/contentModel');
  var EditorOriginView = require('../../global/views/editorOriginView');

  var EditorPageComponentListItemView = EditorOriginView.extend({
    className: 'editor-component-list-item',
    tagName: 'div',

    events: {
      'click': 'onItemClicked',
      'click div.editor-component-list-item-overlay-inner > a': 'onButtonClicked'
    },

    preRender: function(options) {
      this.listenTo(Origin, {
        'editorComponentListView:removeSubviews': this.remove,
        'editorComponentListView:searchKeyup': this.onSearchValueChanged
      });

      this.model.set('availablePositions', options.availablePositions);

      this._parentId = options._parentId;
      this.$parentElement = options.$parentElement;
      this.parentView = options.parentView;
      this.searchTerms = options.searchTerms;
    },

    postRender: function() {
      if (this.model.get('isEnabled') == false) {
        this.$el.addClass('restricted');
      }
    },

    onItemClicked: function(event) {
      event && event.preventDefault();

      const isSelected = this.$el.hasClass('selected');

      $('.editor-component-list-item').removeClass('selected');
      $('.editor-component-list-item-overlay').removeClass('show');

      if(!isSelected) {
        this.$el.addClass('selected');
        this.$('.editor-component-list-item-overlay').addClass('show');
      }
    },

    onSearchValueChanged: function(searchValue) {
      var isSearchTerms = this.searchTerms.indexOf(searchValue.toLowerCase()) > -1 || searchValue.length === 0;
      this.$el.toggleClass('display-none', !isSearchTerms);
    },

    onButtonClicked: function(event) {
      event && event.preventDefault();
      this.addComponent(event.currentTarget.getAttribute('data-position'));
    },

    addComponent: function(layout) {
      Origin.trigger('editorComponentListView:remove');
      const componentType = Origin.editor.data.componentTypes.findWhere({ name: this.model.get('name') });
      const _courseId = Origin.editor.data.course.get('_id');
      Origin.editor.data.newcomponent = new ContentModel({
        _parentId: this._parentId,
        _courseId,
        _type: 'component',
        _component: componentType.get('name'),
        _layout: layout
      });
      Origin.router.navigateTo(`editor/${_courseId}/component/new/`);
    }
  }, {
    template: 'editorPageComponentListItem'
  });

  return EditorPageComponentListItemView;
});
