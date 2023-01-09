// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Backbone = require('backbone');
  var Origin = require('core/origin');
  var EditorOriginView = require('../../global/views/editorOriginView');
  var EditorMenuLayerView = require('./editorMenuLayerView');

  var EditorMenuView = EditorOriginView.extend({
    className: "editor-menu",
    tagName: "div",

    preRender: function() {
      this.layerViews = {};
      this.listenTo(Origin, {
        'editorView:menuView:updateSelectedItem': this.onSelectedItemChanged,
        'editorView:menuView:addItem': this.onItemAdded,
        'editorView:itemDeleted': this.onItemDeleted,
        'window:resize': this.setupHorizontalScroll
      });
    },

    postRender: async function() {
      await this.updateContentObjects();
      this.renderLayers();
      _.defer(this.setViewToReady);
    },
    // Renders all menu layers from the current course to the Origin.editor.currentContentObject
    renderLayers: function() {
      var selectedModel = Origin.editor.currentContentObject || Origin.editor.data.course;
      this.getItemHeirarchy(selectedModel, function(hierarchy) {
        var ids = [];

        for (var i = 0; i < hierarchy.length; i++) {
          var item = hierarchy[i];
          var id = item.get('_id');
          ids.push(id);
          if (!this.layerViews.hasOwnProperty(id)) {
            this.renderLayer(item);
          }
        }
        // remove all unused layerviews 
        for (var id in this.layerViews) {
          if (!this.layerViews.hasOwnProperty(id) || ids.indexOf(id) > -1) {
            continue;
          }
          this.layerViews[id].remove();
          delete this.layerViews[id];
        }
        _.defer(_.bind(function() {
          this.removeSelectedItemStyling();
          this.addSelectedItemStyling(selectedModel.get('_id'));
          this.setUpInteraction();
        }, this));
      });
    },

    // Renders a single menu layer
    renderLayer: function(model) {
      var menuLayerView = new EditorMenuLayerView({
        _parentId: model.get('_id'),
        models: this.contentobjects.where({ _parentId: model.get('_id') })
      });
      this.layerViews[model.get('_id')] = menuLayerView;
      $('.editor-menu-inner').append(menuLayerView.$el);
    },

    updateContentObjects: async function(fetch = false) {
      const models = Origin.editor.data.content;
      if(fetch) {
        try {
          await models.fetch();
        } catch(e) {
          Origin.Notify.alert({ type: 'error', text: 'app.errorfetchingdata' });
        }
      }
      this.contentobjects = new Backbone.Collection(models.filter(c => c.get('_type') === 'menu' || c.get('_type') === 'page'));
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

    addSelectedItemStyling: function(id) {
      this.$('.editor-menu-item[data-id="' + id + '"]').addClass('selected');
      var model = this.contentobjects.findWhere({ _id: id });
      var parentId = model && model.get('_parentId');
      if (parentId) {
        // recurse
        this.addSelectedItemStyling(parentId);
      }
    },

    removeSelectedItemStyling: function() {
      this.$('.editor-menu-item').removeClass('selected');
    },

    // Generates an array with the inheritence line from a given contentobject to the current course
    // @param {Model} contentModel
    // @return {Array}
    getItemHeirarchy: function(model, done) {
      var hierarchy = [];
      if (model.get('_type') === 'menu') {
        hierarchy.push(model);
      }
      var __this = this;
      var _getParent = function(model, callback) {
        var parent = __this.contentobjects.findWhere({ _id: model.get('_parentId') });
        if (parent) {
          hierarchy.push(parent);
          return _getParent(parent, callback);
        }
        hierarchy.push(Origin.editor.data.course);
        callback();
      };
      _getParent(model, function() {
        if (typeof done === 'function') done.call(__this, hierarchy.reverse());
      });
    },

    onSelectedItemChanged: function(model) {
      if (model && model.get('_id') === Origin.editor.currentContentObject && Origin.editor.currentContentObject.get('_id')) return;

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
        stop: _.bind(function(event,ui) {
          var $draggedElement = ui.item;
          var id = $('.editor-menu-item-inner', $draggedElement).attr('data-id');
          var _sortOrder = $draggedElement.index() + 1;
          var _parentId = $draggedElement.closest('.editor-menu-layer').attr('data-parentId');
          var currentModel = this.contentobjects.findWhere({ _id: id });
          currentModel.save({ _sortOrder, _parentId }, {
            patch: true,
            success: model => this.updateItemViews(currentModel.get('_parentId'), model)
          });
          currentModel.set('_isDragging', false);
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
    },

    onItemAdded: function(newModel) {
      this.contentobjects.add(newModel);
    },

    onItemDeleted: async function(oldModel) {
      await this.updateContentObjects(true);
      Origin.trigger('editorView:menuView:updateSelectedItem', this.contentobjects.findWhere({ _id: oldModel.get('_parentId') }));
    }
  }, {
    template: 'editorMenu'
  });

  return EditorMenuView;
});
