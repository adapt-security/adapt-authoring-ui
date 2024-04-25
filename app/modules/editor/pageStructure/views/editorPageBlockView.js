// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Backbone = require('backbone');
  var Origin = require('core/origin');
  var ContentModel = require('core/models/contentModel');
  var EditorOriginView = require('../../global/views/editorOriginView');
  var EditorPageComponentView = require('./editorPageComponentView');
  var EditorPageComponentPasteZoneView = require('./editorPageComponentPasteZoneView');
  var EditorPageComponentListView = require('./editorPageComponentListView');

  var EditorPageBlockView = EditorOriginView.extend({
    className: 'block editable block-draggable page-content-syncing',
    tagName: 'div',
    settings: _.extend({}, EditorOriginView.prototype.settings, {
      hasAsyncPostRender: true,
      autoRender: false
    }),
    events: _.extend({}, EditorOriginView.prototype.events, {
      'click .block-delete': 'deletePrompt',
      'click .add-component': 'showComponentList',
      'click .open-context-block': 'openContextMenu',
      'dblclick': 'loadBlockEdit'
    }),

    preRender: function() {
      this.listenToEvents();
      this.render();
    },

    render: function() {
      var layouts = this.getAvailableLayouts();
      // FIXME why do we have two attributes with the same value?
      this.model.set({ layoutOptions: layouts, dragLayoutOptions: layouts });

      EditorOriginView.prototype.render.apply(this);

      this.addComponentViews();
      this.setupDragDrop();

      this.handleAsyncPostRender();
    },

    animateIn: function() {
      this.$el.removeClass('page-content-syncing');
      Origin.trigger('pageView:itemAnimated', this);
    },

    handleAsyncPostRender: function() {
      var renderedChildren = [];
      if(this.model.getChildren().length === 0) {
        return this.animateIn();
      }
      this.listenTo(Origin, 'editorPageComponent:postRender', function(view) {
        var id = view.model.get('_id');
        if(this.model.getChildren().indexOf(view.model) !== -1 && renderedChildren.indexOf(id) === -1) {
          renderedChildren.push(id);
        }
        if(renderedChildren.length === this.model.getChildren().length) {
          this.stopListening(Origin, 'editorPageComponent:postRender');
          this.animateIn();
        }
      });
    },

    listenToEvents: function() {
      this.listenTo(Origin, 'editorView:removeSubViews editorPageView:removePageSubViews', this.remove);
      this.listenTo(this, {
        'contextMenu:block:edit': this.loadBlockEdit,
        'contextMenu:block:cut': this.onCut,
        'contextMenu:block:copy': this.onCopy,
        'contextMenu:block:copyID': this.onCopyID,
        'contextMenu:block:paste': this.onPaste,
        'contextMenu:block:delete': this.deletePrompt
      });
    },

    postRender: function() {
      this.trigger('blockView:postRender');
      Origin.trigger('pageView:itemRendered', this);
    },

    getAvailableLayouts: function() {
      var layoutOptions = {
        full: { type: 'full', name: 'app.layoutfull', pasteZoneRenderOrder: 1 },
        left: { type: 'left', name: 'app.layoutleft', pasteZoneRenderOrder: 2 },
        right: { type: 'right', name: 'app.layoutright', pasteZoneRenderOrder: 3 }
      };
      if (!this.model.getChildren().length) {
        return [layoutOptions.full,layoutOptions.left,layoutOptions.right];
      }
      if (this.model.getChildren().length === 1) {
        var layout = this.model.getChildren().first().get('_layout');
        if(layout === layoutOptions.left.type) return [layoutOptions.right];
        if(layout === layoutOptions.right.type) return [layoutOptions.left];
      }
      return [];
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
          // Store the offset to stop the page jumping during the start of drag
          // because of the drop zones changing the scroll position on the page
          view.offsetTopFromWindow = view.$el.offset().top - $(window).scrollTop();
          // This is in the helper method because the height needs to be
          // manipulated before the drag start method due to adding drop zones
          view.showDropZones();
          $(this).attr('data-' + view.model.get('_type') + '-id', view.model.get('_id'));
          $(this).attr('data-' + view.model.get('_parent') + '-id', view.model.get('_parentId'));
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

          if(clientY < (offsetTop + SCROLL_THRESHOLD)) {
            scrollAmount = -SCROLL_INCREMENT;
          }
          else if(clientY > (($container.height() + offsetTop) - SCROLL_THRESHOLD)) {
            scrollAmount = SCROLL_INCREMENT;
          }

          if(scrollAmount) {
            autoScrollTimer = window.setInterval(function() {
              $container.scrollTop($container.scrollTop() + scrollAmount);
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

    addComponentViews: function() {
      this.removeChildViews();
      this.addComponentButtonLayout();
      this.model.getChildren().forEach(model => {
        const view = new EditorPageComponentView({ model });
        this.addChildView(view);
      });
      this.setupPasteZones();
    },

    addComponentButtonLayout: function() {
      if(this.model.getChildren().length === 2) {
        return;
      }
      if(this.model.getChildren().length === 0) {
        this.$('.add-component').addClass('full');
      } else {
        var layout = this.model.getChildren().first().get('_layout');
        this.$('.add-component').addClass(layout === 'left' ? 'right' : 'left');
      }
    },

    getRouteIdentifier: function() {
      return this.model.get('_friendlyId') || this.model.get('_id');
    },

    loadBlockEdit: function (event) {
      var courseId = Origin.editor.data.course.get('_courseId');
      var routeId = this.getRouteIdentifier();
      Origin.router.navigateTo(`editor/${courseId}/${routeId}/edit`);
    },

    removeComponentListView() {
      if (!this.componentListView) return;
      this.componentListView.remove();
      this.componentListView = null;
    },

    showComponentList: function(event) {
      event.preventDefault();

      this.removeComponentListView();

      this.componentListView = new EditorPageComponentListView({
        model: new Backbone.Model({
          title: Origin.l10n.t('app.addcomponent'),
          body: Origin.l10n.t('app.pleaseselectcomponent'),
          _parentId: this.model.get('_id'),
          layoutOptions: this.model.get('layoutOptions'),
          parent: this.model
        }),
        $parentElement: this.$el,
        parentView: this
      });

      $('body').append(this.componentListView.$el);
    },

    setupPasteZones: function() {
      _.each(this.sortArrayByKey(this.model.get('layoutOptions'), 'pasteZoneRenderOrder'), layout => {
        var model = new ContentModel({ 
          _type: 'component',
          _parentId: this.model.get('_id'),
          _pasteZoneLayout: layout.type,
        });
        this.$(this.constructor.childContainer).append(
          new EditorPageComponentPasteZoneView({ model, customClasses: 'drop-only' }).$el,
          new EditorPageComponentPasteZoneView({ model }).$el
        );
      }, this);
    },

    /* onPaste: async function(data) {
      this.model.getChildren().push(await new ContentModel({ _id: data._id, _type: 'component' }).save());
      this.render();
    } */

    remove: function() {
      this.removeComponentListView();
      return EditorOriginView.prototype.remove.apply(this, arguments);
    }

  }, {
    childContainer: '.page-components',
    template: 'editorPageBlock'
  });

  return EditorPageBlockView;

});
