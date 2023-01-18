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

      this.$parentElement = options.$parentElement;
      this.parentModel = options.parentModel;
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

    addComponent: function(_layout) {
      Origin.trigger('editorComponentListView:remove');
      const _courseId = Origin.editor.data.course.get('_id');
      Origin.editor.data.newcomponent = new ContentModel({
        _parentId: this.parentModel.get('_id'),
        _courseId,
        _type: 'component',
        _component: this.model.get('name'),
        _layout,
        parent: this.parentModel
      });
      Origin.router.navigateTo(`editor/${_courseId}/component/${this.model.get('name')}/new`);
    }
  }, {
    template: 'editorPageComponentListItem'
  });

  return EditorPageComponentListItemView;
});
