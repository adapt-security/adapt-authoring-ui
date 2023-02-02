// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Origin = require('core/origin');
  var EditorOriginView = require('../../global/views/editorOriginView');

  var EditorMenuItemView = EditorOriginView.extend({
    autoScrollTimer: false,
    className: "editor-menu-item",
    clickTimer: undefined,
    clickTimerActive: false,
    tagName: "div",

    events: {
      'click .editor-menu-item-inner': 'onMenuItemClicked',
      'click .open-context-contentObject': 'openContextMenu',
      'click .contentObject-delete': 'deletePrompt',
      'mousedown .handle': 'enableDrag'
    },

    preRender: function() {
      this.setupClasses();
    },

    postRender: function() {
      this.setupEvents();
    },

    remove: function() {
      this.$el.closest('.editor-menu-layer').off('mousemove');
      EditorOriginView.prototype.remove.apply(this, arguments);
    },

    setupEvents: function() {
      this.listenTo(Origin, 'editorView:removeSubViews', this.remove);

      var type = this.model.get('_type');

      this.on(`contextMenu:${type}:copy`, this.copyMenuItem);
      this.on(`contextMenu:${type}:copyID`, this.copyID);
      this.on(`contextMenu:${type}:delete`, this.deletePrompt);
      this.on(`contextMenu:${type}:edit`, this.editMenuItem);

      this.$el.closest('.editor-menu').on('mousemove', _.bind(this.handleDrag, this));
    },

    setupClasses: function() {
      const classes = [`content-type-${this.model.get('_type')}`];
      if(Origin.editor.currentContentObject) {
        const selectedId = Origin.editor.currentContentObject.get('_id');
        const isSelected = this.model.getHierarchy().some(c => c.get('_id') === selectedId);
        if(isSelected) classes.push('selected');
      }
      this.$el.addClass(classes.join(' '));
    },

    onMenuItemClicked: function(event) {
      event && event.preventDefault();
      this.trigger('click', this);
      // handle double-click
      if(this.clickTimerActive) {
        return this.onMenuItemDoubleClicked(event);
      }
      this.clickTimerActive = true;
      // jQuery doesn't allow dblclick and click on the same element, so have to do it ourselves
      this.clickTimer = window.setTimeout(_.bind(function() {
        this.clickTimerActive = false;
        window.clearTimeout(this.clickTimer);
      }, this), 300);
    },

    onMenuItemDoubleClicked: function(event) {
      event && event.preventDefault();
      this.trigger('dblclick', this);
    },

    editMenuItem: function() {
      var courseId = Origin.editor.data.course.get('_id');
      var type = this.model.get('_type');
      var menuItemId = this.model.get('_id');
      Origin.router.navigateTo(`editor/${courseId}/${type}/${menuItemId}/edit`);
    },

    copyMenuItem: function() {
      Origin.trigger('editorView:copy', this.model);
    },

    copyID: function() {
      Origin.trigger('editorView:copyID', this.model);
    },

    enableDrag: function(event) {
      this.model.set('_isDragging', true);
    },

    handleDrag: function(event) {
      window.clearInterval(this.autoScrollTimer);
      this.autoScrollTimer = false;

      if(!this.model.get('_isDragging')) {
        return;
      }
      var $currentLayer = $(".editor-menu-layer[data-over='true'] > .editor-menu-layer-inner");

      if(!$currentLayer.length) {
        return;
      }
      this.autoScrollTimer = window.setInterval(function() {
        var SCROLL_THRESHOLD = $currentLayer.height()*0.2;
        var SCROLL_INCREMENT = 4;

        var offsetTop = $currentLayer.offset().top;
        var clientY = event.clientY;
        var scrollAmount;

        if (clientY < (offsetTop+SCROLL_THRESHOLD)) {
          scrollAmount = -SCROLL_INCREMENT;
        }
        else if (clientY > (($currentLayer.height()+offsetTop) - SCROLL_THRESHOLD)) {
          scrollAmount = SCROLL_INCREMENT;
        }
        if(scrollAmount) {
          $currentLayer.scrollTop($currentLayer.scrollTop()+scrollAmount);
        }
      }, 10);
    }
  }, {
    template: 'editorMenuItem'
  });

  return EditorMenuItemView;
});
