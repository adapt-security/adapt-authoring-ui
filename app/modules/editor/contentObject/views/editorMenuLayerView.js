// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
	var ArticleModel = require('core/models/articleModel');
	var BlockModel = require('core/models/blockModel');
	var ContentObjectModel = require('core/models/contentObjectModel');
	var EditorMenuItemView = require('./editorMenuItemView');
  var EditorOriginView = require('../../global/views/editorOriginView');

  var EditorMenuLayerView = EditorOriginView.extend({
    className: 'editor-menu-layer',
    models: undefined,

    events: {
      'click button.editor-menu-layer-add-page': 'addNewPage',
      'click button.editor-menu-layer-add-menu': 'addNewMenu',
      'click .editor-menu-layer-paste': 'pasteMenuItem',
      'click .editor-menu-layer-paste-cancel': 'cancelPasteMenuItem'
    },

    initialize: function(options) {
      this.models = options.models;
      EditorOriginView.prototype.initialize.apply(this, arguments);
    },

    preRender: function(options) {
      this.childViews = [];
      if (options._parentId) {
        this._parentId = options._parentId;
      }
      var events = {
        'editorView:removeSubViews': this.remove,
        'editorMenuView:removeMenuViews': this.remove
      };
      events['editorView:pasted:' + this._parentId] = this.onPaste;
      this.listenTo(Origin, events);
    },

    render: function() {
      var data = this.data ? this.data : false;
      var template = Handlebars.templates[this.constructor.template];

      this.$el.html(template(data));
      this.renderMenuItems();

      _.defer(this.postRender.bind(this));
      return this;
    },

    renderMenuItems: function() {
      this.models.forEach(m => this.addMenuItemView(m));
    },

    postRender: function() {
      // Append the parentId value to the container to allow us to move pages, etc.
      if (this._parentId) this.$el.attr('data-parentid', this._parentId);
      this.setHeight();
    },

    setHeight: function() {
      var windowHeight = $(window).height();
      var offsetTop = $('.editor-menu-inner').offset().top;
      var controlsHeight = this.$('.editor-menu-layer-controls').outerHeight();

      this.$('.editor-menu-layer-inner').height(windowHeight - (offsetTop + controlsHeight));
    },

    addNewMenu: function(event) {
      this.addNewMenuItem(event, 'menu');
    },

    addNewPage: function(event) {
      this.addNewMenuItem(event, 'page');
    },

    /**
     * Adds a new contentObject of a given type
     * @param {String} type Given contentObject type, i.e. 'menu' or 'page'
     */
    addNewMenuItem: function(event, type) {
      event && event.preventDefault();

      var newMenuItemModel = new ContentObjectModel({
        _parentId: this._parentId,
        _courseId: Origin.editor.data.course.get('_id'),
        linkText: Origin.l10n.t('app.view'),
        graphic: { alt: '', src: '' },
        _type: type
      });
      // Instantly add the view for UI purposes
      var newMenuItemView = this.addMenuItemView(newMenuItemModel);
      newMenuItemView.$el.addClass('syncing');

      newMenuItemModel.save(null, {
        success: _.bind(function(model) {
          Origin.trigger('editorView:menuView:addItem', model);
          // Force setting the data-id attribute as this is required for drag-drop sorting
          newMenuItemView.$el.attr('data-id', model.get('_id'));
          newMenuItemView.$el.children('.editor-menu-item-inner').attr('data-id', model.get('_id'));
          newMenuItemView.render();
          if (type === 'page') {
            // HACK -- This should be removed and placed on the server-side
            this.addNewPageArticleAndBlock(model, newMenuItemView);
            return;
          }
          newMenuItemView.$el.removeClass('syncing');
          this.setHeight();
        }, this),
        error: function(error) {
          // fade out menu item and alert
          newMenuItemView.$el.removeClass('syncing').addClass('not-synced');
          Origin.Notify.alert({ type: 'error', text: Origin.l10n.t('app.errormenueditorbody') });
          _.delay(newMenuItemView.remove, 3000);
        }
      });
    },

    addNewPageArticleAndBlock: function(model, newMenuItemView) {
      var typeToAdd;
      var newChildModel;
      this.pageModel;
      this.pageView;

      if (model.get('_type') === 'page') {
        this.pageModel = model;
        this.pageView = newMenuItemView;
        typeToAdd = 'article';
        var newChildModel = new ArticleModel();
      } else {
        typeToAdd = 'block';
        var newChildModel = new BlockModel();
      }
      newChildModel.save({
        _parentId: model.get('_id'),
        _courseId: Origin.editor.data.course.get('_id')
      }, {
        error: function() {
          newMenuItemView.$el.removeClass('syncing').addClass('not-synced');
          Origin.Notify.alert({
            type: 'error',
            text: Origin.l10n.t('app.errormenueditorbody'),
          });
          _.delay(newMenuItemView.remove, 3000);
        },
        success: _.bind(function(model, response, options) {
          if (typeToAdd === 'article') {
            this.addNewPageArticleAndBlock(model, newMenuItemView);
          } else {
            newMenuItemView.$el.removeClass('syncing');
          }
        }, this)
      });
    },

    addMenuItemView: function(model) {
      var newMenuItemView = new EditorMenuItemView({ model });
      this.$('.editor-menu-layer-inner').append(newMenuItemView.$el);

      newMenuItemView.on({
        'click': _.bind(this.onMenuItemClicked, this),
        'dblclick': _.bind(this.onMenuItemDblclicked, this)
      });
      this.childViews.push(newMenuItemView);
      return newMenuItemView;
    },

    pasteMenuItem: function(event) {
      event && event.preventDefault();
      Origin.trigger('editorView:paste', this._parentId, this.$('.editor-menu-item').length + 1);
    },

    cancelPasteMenuItem: function(event) {
      event && event.preventDefault();
      this.hidePasteZones();
      var target = new ContentObjectModel({
        _parentId: this._parentId,
        _courseId: Origin.editor.data.course.get('_id')
      });
      Origin.trigger('editorView:pasteCancel', target);
    },

    onMenuItemClicked: function(menuItem) {
      // if item's already selected, don't bother continuing
      if (menuItem.$el.hasClass('selected')) {
        return;
      }
      Origin.trigger('editorView:menuView:updateSelectedItem', menuItem.model);
    },

    onMenuItemDblclicked: function({ model }) {
      var type = model.get('_type');
      var route = `editor/${Origin.editor.data.course.get('_id')}/${type}/${model.get('_id')}`;
      if (type === 'menu') route += '/edit';
      Origin.router.navigateTo(route);
    },

    onPaste: function(data) {
      this.addMenuItemView(new ContentObjectModel(data));
    },

    remove: function() {
      this.childViews.forEach(c => c.remove());
      EditorOriginView.prototype.remove.apply(this, arguments);
    }
  }, {
    template: 'editorMenuLayer'
  });

  return EditorMenuLayerView;
});
