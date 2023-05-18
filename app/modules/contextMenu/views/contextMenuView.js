// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/origin');
  var ContextMenuItemView = require('./contextMenuItemView');

  var ContextMenuView = Backbone.View.extend({
    className: 'context-menu',
    contextView : {},

    initialize: function() {
      this._isVisible = false;
      this.listenTo(Origin, {
        'contextMenu:open': this.toggleMenu,
        'contextMenu:closeContextMenu remove remove:views': this.hideMenu
      });
      $('html').on('contextmenu', () => this.hideMenu())
      $('html').click(_.bind(this.hideMenu, this));
      $(document).on('keyup', _.bind(this.onKeyUp, this));
      this.render();
    },

    render: function() {
      var template = Handlebars.templates['contextMenu'];
      $(this.el).html(template).appendTo('body');
      return this;
    },

    renderItems: function() {
      this.$('.context-menu-holder').empty();
      Origin.trigger('contextMenu:empty');

      _.each(this.collection.where({ type: this.type }), function(item) {
        item.set('contextView', this.contextView);
        new ContextMenuItemView({ model: item });
      }, this);
    },

    toggleMenu: function(view, e) {
      var isSameType = view && this.getType(view, e) === this.type;
      var isSameModel = view && (view.model.get('_id')) === (this.contextView.model && this.contextView.model.get('_id'));
      var isSameView = view.cid === this.contextView.cid; // to make sure we don't break listeners
      
      this.isClamped = e.type !== 'contextmenu';
      // new view, update the menu items
      if(!isSameType || !isSameModel || !isSameView) {
        this.setMenu(view, e);
      }
      (e.type !== 'contextmenu' && this._isVisible) ? this.hideMenu() : this.showMenu();
      this.setCoords(e);
    },

    setCoords(e) {
      if (e.type !== 'contextmenu') {
        const $parent = $(e.currentTarget);
        this.coords = {
          left: $parent.offset().left + $parent.width() + 10,
          top: $parent.offset().top - ($parent.height()/2)
        }
      }

      this.mouseCoords = { x: e.clientX, y: e.clientY };

      this.coords = {
        top:e.clientY,
        left:e.clientX
      }
      
      const htmlEl = $('html')[0];
      const availableWidth = htmlEl.clientWidth;
      const availableHeight = htmlEl.clientHeight;
      const menuWidth = this.$el.outerWidth();
      const menuHeight = this.$el.outerHeight();

      if (this.coords.left + menuWidth > availableWidth) {
        this.coords.left = availableWidth - menuWidth;
      }

      if (this.coords.top + menuHeight > availableHeight) {
        this.coords.top = this.coords.top - menuHeight;
      }

      this.updatePos();
    },

    getType(view, e) {
      if (view.getContextMenuType) return view.getContextMenuType(e);
      
      return view.model.get('_type');
    },

    setMenu: function(view, e) {
      this.contextView = view;
      this.type = this.getType(view, e);
      console.log('ContextMenuView::setMenu', this.type, view.model.get('_id'));

      this.renderItems();
    },

    showMenu: function() {
      this.$el.removeClass('display-none');
      this._isVisible = true;
      Origin.trigger('contextMenu:opened');
    },

    hideMenu: function() {
      this.$el.addClass('display-none');
      this._isVisible = false;
      Origin.trigger('contextMenu:closed');
    },

    updatePos: function() {
      this.$el.css({...this.coords, position: 'absolute'});
    },

    onKeyUp: function(e) {
      if (e.keyCode !== 27) return;

      this.hideMenu();
    }
  });

  return ContextMenuView;
});
