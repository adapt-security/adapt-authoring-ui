// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var _ = require('underscore');
  var Origin = require('core/origin');
  var EditorOriginView = require('../../global/views/editorOriginView');
  var EditorPageComponentListItemView = require('./editorPageComponentListItemView');

  var EditorPageComponentListView = EditorOriginView.extend({
    className: "editor-component-list",
    tagName: "div",
    events: {
      'click': 'onOverlayClicked',
      'click .editor-component-list-sidebar-exit, .click-capture': 'closeView',
      'keyup .editor-component-list-sidebar-search input': 'onSearchKeyup'
    },

    preRender: function(options) {
      this.listenTo(Origin, 'editorComponentListView:remove', this.remove);
      
      this.$parentElement = options.$parentElement;
      this.parentView = options.parentView;

      const layoutOptions = this.model.get('layoutOptions').map(l => l.type);
      this.availablePositions = ['left', 'right', 'full'].reduce((m, layout) => {
        return Object.assign(m, { [layout]: layoutOptions.includes(layout) });
      }, {});
      this.model.set('_availablePosition', this.availablePositions);
    },

    postRender: function() {
      this.renderComponentList();
      this.$('.editor-component-list-sidebar-search-field input').focus();
    },

    closeView: function() {
      this.$el.removeClass('show');
      setTimeout(this.remove.bind(this), 500);
    },

    renderComponentList: function() {
      Origin.trigger('editorComponentListView:removeSubviews');

      Origin.editor.data.componentTypes.forEach(function(componentType) {
        if(!componentType.get('isEnabled')) {
          return;
        }
        var availablePositions = _.clone(this.availablePositions);
        var supportedLayouts = componentType.get('_supportedLayout')?.enum;
        if (supportedLayouts) {
          availablePositions.left = availablePositions.right = supportedLayouts.includes('half-width');
          availablePositions.full = supportedLayouts.includes('full-width');
        }
        this.$('.editor-component-list-sidebar-list').append(new EditorPageComponentListItemView({
          model: componentType,
          availablePositions: availablePositions,
          _parentId: this.model.get('_parentId'),
          $parentElement: this.$parentElement,
          parentView: this.parentView,
          searchTerms: componentType.get('displayName').toLowerCase()
        }).$el);
      }, this);
      this.$el.addClass('show');
    },

    onOverlayClicked: function(event) {
      if($(event.target).hasClass('editor-component-list')) {
        Origin.trigger('editorComponentListView:removeSubviews');
        $('html').css('overflow-y', '');
        this.remove();
      }
    },

    onSearchKeyup: function(event) {
      Origin.trigger('editorComponentListView:searchKeyup', $(event.currentTarget).val());
    }
  }, {
    template: 'editorPageComponentList'
  });

  return EditorPageComponentListView;
});
