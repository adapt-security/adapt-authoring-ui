// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var EditorOriginView = require('../../global/views/editorOriginView');
  var EditorMenuLayerView = require('./editorMenuLayerView');
  var Origin = require('core/origin');

  var EditorMenuView = EditorOriginView.extend({
    className: "editor-menu",
    tagName: "div",

    preRender: function() {
      Origin.contentHeader.setTitle({
        breadcrumbs: ['course', { title: Origin.l10n.t('app.editormenu') }],
        title: Origin.l10n.t('app.coursestructuretitle')
      });
      this.layerViews = [];
      this.listenTo(Origin, {
        'editorData:loaded': this.render,
        'editorView:menuView:updateSelectedItem': this.onSelectedItemChanged,
        'window:resize': this.setupHorizontalScroll
      });
    },

    postRender: async function() {
      this.renderLayers();
      _.defer(() => this.setViewToReady());
    },
    // Renders all menu layers from the current course to the Origin.editor.currentContentObject
    renderLayers: function() {
      this.layerViews.forEach(v => v.remove());
      $('.editor-menu-inner').empty();

      const hierarchy = (Origin.editor.currentContentObject || Origin.editor.data.course).getHierarchy();
      hierarchy.forEach(c => {
        const models = c.getChildren().filter(c => c.get('_type') === 'menu' || c.get('_type') === 'page');
        if(!models.length && c.get('_type') !== 'course') {
          return;
        }
        const menuLayerView = new EditorMenuLayerView({ _parentId: c.get('_id'), models });
        $('.editor-menu-inner').append(menuLayerView.$el);
        this.layerViews.push(menuLayerView);
      });
      const firstButton = this.layerViews[0].childViews[0];
      firstButton.trigger('click', firstButton);

      this.setUpInteraction();
    },

    updateItemViews: function(previousParent, model) {
      // since we remove the childViews when the layerView is destroyed 
      // we must move menuItemView to its new layerView
      var index = -1;
      for (var i = 0; i < this.layerViews[previousParent].childViews.length; i++) {
        var v = this.layerViews[previousParent].childViews[i];
        if (v.model.get('_id') === model.get('_id')) {
          index = i;
          break;
        }
      }
      var view = this.layerViews[previousParent].childViews.splice(index, 1);
      this.layerViews[model.get('_parentId')].childViews.push(view[0]);
    },

    setUpInteraction: function() {
      this.setupDragDrop();
      var $window = $(window);
      this.setupHorizontalScroll($window.width(), $window.height());
      this.scrollToElement();
    },

    onSelectedItemChanged: function(model) {
      const currentId = Origin.editor.currentContentObject && Origin.editor.currentContentObject.get('_id');
      const newId = model && model.get('_id');
      if(newId === currentId) {
        return;
      }
      Origin.editor.currentContentObject = model;
      this.renderLayers();
    },

    setupHorizontalScroll: function(windowWidth, windowHeight) {
      var $menuLayers = this.$('.editor-menu-layer');
      var itemWidth = $menuLayers.first().outerWidth(true);
      $('.editor-menu-inner').width(itemWidth * $menuLayers.length);
    },

    scrollToElement: function() {
      if ($('.selected').length < 1) {
        return;
      }
      this.$('.editor-menu-layer-inner').scrollTo('.expanded, .selected', { duration: 300, offset: { top: -20, left: 0 }, axis: 'y' });
      this.$el.scrollTo($('.selected').closest('.editor-menu-layer'), { duration: 300, axis: 'x' });
    },

    // Configures the JQueryUI sortable() plugin to enable drag and drop
    setupDragDrop: function() {
      $(".editor-menu-layer-inner").sortable({
        containment: '.editor-menu',
        appendTo: '.editor-menu',
        items: '.editor-menu-item',
        handle: '.handle',
        connectWith: ".editor-menu-layer-inner",
        scroll: true,
        helper: 'clone',
        placeholder: 'sortable-placeholder',
        start: function(event, ui) {
          ui.placeholder.height(ui.item.height());
        },
        stop: _.bind(function(event, ui) {
          var $el = ui.item;
          var currentModel = Origin.editor.data.content.findWhere({ _id: $('.editor-menu-item-inner', $el).attr('data-id') });
          currentModel.set('_isDragging', false);
          const data = {
            _sortOrder: $el.index() + 1,
            _parentId: $el.closest('.editor-menu-layer').attr('data-parentId')
          };
          Object.entries(data).forEach(([key, val]) => {
            if(currentModel.get(key) === val) delete data[key];
          });
          // only save if something's changed
          if(Object.keys(data).length) currentModel.save(data, { patch: true });
        }, this),
        over: function(event, ui) {
          $(event.target).closest('.editor-menu-layer').attr('data-over', true);
        },
        out: function(event, ui) {
          $(event.target).closest('.editor-menu-layer').attr('data-over', false);
        },
        receive: function(event, ui) {
          // Prevent moving a menu item between levels
          if (ui.item.hasClass('content-type-menu')) ui.sender.sortable("cancel");
        }
      });
    }
  }, {
    template: 'editorMenu'
  });

  return EditorMenuView;
});