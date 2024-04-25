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
      'mousedown .handle': 'enableDrag',
      'contextmenu': 'onContextMenu'
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

      this.on(`contextMenu:editor-menu-item:cut`, this.onCut);
      this.on(`contextMenu:editor-menu-item:copy`, this.onCopy);
      this.on(`contextMenu:editor-menu-item:copyID`, this.onCopyID);
      this.on(`contextMenu:editor-menu-item:delete`, this.deleteItemPrompt);
      this.on(`contextMenu:editor-menu-item:edit`, this.editMenuItem);
      this.on(`contextMenu:editor-menu-item:open`, this.openMenuItem);
      this.on(`contextMenu:editor-menu-item:paste`, this.onPaste);

      this.$el.closest('.editor-menu').on('mousemove', _.bind(this.handleDrag, this));
    },

    setupClasses: function() {
      const classes = [`content-type-${this.model.get('_type')}`];
      if(Origin.editor.currentContentObject) {
        const selectedIds = Origin.editor.currentContentObject.getHierarchy().map(c => c.get('_id'));
        if(selectedIds.includes(this.model.get('_id'))) classes.push('selected');
      }
      this.$el.addClass(classes.join(' '));
    },

    getContextMenuType(e) {
      return 'editor-menu-item';
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

    getRouteIdentifier: function() {
      return this.model.get('_friendlyId') || this.model.get('_id');
    },

    editMenuItem: function(eventName) {
      var courseId = Origin.editor.data.course.get('_courseId');
      let route = `editor/${courseId}/${this.getRouteIdentifier()}/`;
      if(eventName === 'edit') route += 'edit'
      Origin.router.navigateTo(route);
    },

    openMenuItem: function() {
      var courseId = Origin.editor.data.course.get('_courseId');
      var type = this.model.get('_type');
      var route = `editor/${courseId}/${this.getRouteIdentifier()}`;
      if (type === 'menu') route += '/edit';
      Origin.router.navigateTo(route);
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
    },
    
    getSortOrderFromContextMenuPosition: function() {
      // when pasting directly onto a menu item no sort order is inferred
      return undefined;
    }
  }, {
    template: 'editorMenuItem'
  });

  return EditorMenuItemView;
});
