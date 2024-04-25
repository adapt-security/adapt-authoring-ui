// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(['../../global/views/editorOriginView', 'core/origin'], function(EditorOriginView, Origin) {
  var EditorPageComponentView = EditorOriginView.extend({
    className: 'component editable component-draggable',
    tagName: 'div',
    settings: _.extend({}, EditorOriginView.prototype.settings, {
      autoRender: false,
    }),
    events: _.extend({}, EditorOriginView.prototype.events, {
      'click .component-delete': 'deletePrompt',
      'click .component-move': 'evaluateMove',
      'click .open-context-component': 'openContextMenu',
      'dblclick': 'loadComponentEdit'
    }),

    preRender: function() {
      this.$el.addClass('component-' + this.model.get('_layout'));
      this.listenTo(Origin, 'editorView:removeSubViews editorPageView:removePageSubViews', this.remove);
      this.on({
        'contextMenu:component:edit': this.loadComponentEdit,
        'contextMenu:component:cut': this.onCut,
        'contextMenu:component:copy': this.onCopy,
        'contextMenu:component:copyID': this.onCopyID,
        'contextMenu:component:paste': this.onPaste,
        'contextMenu:component:delete': this.deletePrompt
      });
      const layouts = this.evaluateLayout();
      this.model.set({
        _movePositions: layouts,
        componentName: Origin.editor.data.components.findWhere({ name: this.model.get('_component') }).get('displayName')
      });
      this.render();
    },

    postRender: function () {
      this.setupDragDrop();
      _.defer(_.bind(function(){
        this.trigger('componentView:postRender');
        Origin.trigger('pageView:itemRendered', this);
      }, this));
    },

    getRouteIdentifier: function() {
      return this.model.get('_friendlyId') || this.model.get('_id');
    },

    loadComponentEdit: function(event) {
      var courseId = Origin.editor.data.course.get('_courseId');
      var routeId = this.getRouteIdentifier();
      Origin.router.navigateTo(`editor/${courseId}/${routeId}/edit`);
    },

    setupDragDrop: function() {
      var view = this;
      var autoScrollTimer = false;
      var $container = $('.contentPane');

      this.$el.draggable({
        opacity: 0.8,
        handle: '.handle',
        revert: 'invalid',
        zIndex: 10000,
        cursorAt: {
          top: 22,
          left: 0
        },
        appendTo:'.contentPane',
        containment: '.contentPane',
        helper: function (e) {
          /** 
           * Store the offset to stop the page jumping during the start of drag
           * because of the drop zones changing the scroll position on the page
           */
          view.offsetTopFromWindow = view.$el.offset().top - $(window).scrollTop();
          /** 
           * This is in the helper method because the height needs to be
           * manipulated before the drag start method due to adding drop zones
           * Passing the supported layout as a parameter allows the method to
           * determine which drop zones should be displayed
           */
          var supportedLayout = view.getSupportedLayout();
          view.showDropZones(supportedLayout);
          $(this).attr('data-component-id', view.model.get('_id'));
          $(this).attr('data-block-id', view.model.get('_parentId'));
          return $('<div class="drag-helper">' + view.model.get('title') + '</div>');
        },
        start: function(event) {
          // Using the initial offset we're able to position the window back in place
          $(window).scrollTop(view.$el.offset().top -view.offsetTopFromWindow);
        },
        drag: function(event) {
          window.clearInterval(autoScrollTimer);

          var SCROLL_THRESHOLD = $container.height()*0.2;
          var SCROLL_INCREMENT = 7;

          var offsetTop = $container.offset().top;
          var clientY = event.originalEvent.clientY;
          var scrollAmount;

          if (clientY < (offsetTop+SCROLL_THRESHOLD)) {
            scrollAmount = -SCROLL_INCREMENT;
          }
          else if (clientY > (($container.height()+offsetTop) - SCROLL_THRESHOLD)) {
            scrollAmount = SCROLL_INCREMENT;
          }

          if(scrollAmount) {
            autoScrollTimer = window.setInterval(function() {
              $container.scrollTop($container.scrollTop()+scrollAmount);
            }, 10);
          }
        },
        stop: function () {
          window.clearInterval(autoScrollTimer);
          view.hideDropZones();
          $container.scrollTop($(this).offset().top*-1);
        }
      });
    },

    getSupportedLayout: function() {
      return { full: true, half: true };
    },

    evaluateLayout: function(cb) {
      var supportedLayout = this.getSupportedLayout();
      var movePositions = {
        left: false,
        right: false,
        full: false
      };
      const siblings = this.model.getSiblings();
      var showFull = supportedLayout.full && siblings.length < 1;
      switch(this.model.get('_layout')) {
        case 'left':
          movePositions.right = supportedLayout.half;
          movePositions.full = showFull;
          break;
        case 'right':
          movePositions.left = supportedLayout.half;
          movePositions.full = showFull;
          break;
        case 'full':
          movePositions.left = supportedLayout.half;
          movePositions.right = supportedLayout.half;
          break
      }
      return movePositions;
    },

    evaluateMove: function(event) {
      event && event.preventDefault();
      var $btn = $(event.currentTarget);
      const siblings = this.model.getSiblings();
      var isLeft = $btn.hasClass('component-move-left');
      var isRight = $btn.hasClass('component-move-right');
      // move self to layout of clicked button
      this.moveComponent(this.model.get('_id'), (isLeft ? 'left' : isRight ? 'right' : 'full'));
      // move sibling to inverse of self
      var siblingId = siblings.length && siblings.first().get('_id');
      if (siblingId) this.moveComponent(siblingId, (isLeft ? 'right' : 'left'));
    },

    moveComponent: function (id, _layout) {
      this.model.save({ _layout });
    }
  }, {
    template: 'editorPageComponent'
  });

  return EditorPageComponentView;
});
