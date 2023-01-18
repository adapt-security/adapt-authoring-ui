// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var Helpers = require('core/helpers');
	var ContentModel = require('core/models/contentModel');
	var EditorMenuItemView = require('./editorMenuItemView');
  var EditorOriginView = require('../../global/views/editorOriginView');

  var EditorMenuLayerView = EditorOriginView.extend({
    className: 'editor-menu-layer',
    models: undefined,

    events: {
      'click button.editor-menu-layer-add': 'addNewMenuItem',
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
      this.models
        .sort(Helpers.sortContentObjects)
        .forEach(m => this.addMenuItemView(m));
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

    addNewMenuItem: async function(event) {
      event && event.preventDefault();
      const _type = $(event.currentTarget).attr('data-type');
      const model = new ContentModel(await $.ajax({ url: `api/content/insertrecusive?rootId=${this._parentId}`, method: 'post', data: { _type } }));

      var newMenuItemView = this.addMenuItemView(model);
      newMenuItemView.$el.addClass('syncing');
      newMenuItemView.$el.attr('data-id', model.get('_id'));
      newMenuItemView.$el.children('.editor-menu-item-inner').attr('data-id', model.get('_id'));
      newMenuItemView.render();
      
      newMenuItemView.$el.removeClass('syncing');
      
      this.setHeight();
      
      Origin.trigger('editorView:menuView:addItem', model);
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
      var target = new ContenModel({
        _type: 'contentobject',
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
      this.addMenuItemView(new ContenModel(Object.assign(data, { _type: 'contentobject' })));
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
