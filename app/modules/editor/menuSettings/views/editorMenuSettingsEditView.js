// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/origin');
  var EditorOriginView = require('../../global/views/editorOriginView');
  var ContentPluginCollection = require('core/collections/contentPluginCollection');
  var MenuSettingsView = require('./editorMenuSettingsView');

  var EditorMenuSettingsEditView = EditorOriginView.extend({
    className: "editor-menu-settings-edit",
    tagName: "ul",

    preRender: function() {
      this.collection = new ContentPluginCollection(undefined, { type: 'menu' });
      this.listenTo(this.collection, 'sync', this.addMenuItemView);
      this.collection.fetch();

      this.listenTo(Origin, {
        'editorSideBarView:removeEditView': this.remove,
        'editorMenuSettingsEditSidebar:views:save': this.saveData
      });
    },

    addMenuItemView: function() {
      this.renderMenuItemViews();
    },

    renderMenuItemViews: function() {
      this.collection.each(function(menu) {
        menu.set('_isSelected', menu.get('name') === Origin.editor.data.config.get('_menu'));
        this.$('.menu-settings-list').append(new MenuSettingsView({ model: menu }).$el);
      }, this);
      this.setViewToReady();
    },

    cancel: function(event) {
      event && event.preventDefault();
      Origin.trigger('editorSidebarView:removeEditView', this.model);
    },

    saveData: function(event) {
      event && event.preventDefault();

      var selectedMenu = this.collection.findWhere({ _isSelected: true });

      if(!selectedMenu) {
        return this.onSaveError(null, Origin.l10n.t('app.errornomenuselected'));
      }
      $.ajax({
        url: `api/content/${this.model.get('_courseId')}`,
        method: 'PATCH',
        data: { 
          _menu: selectedMenu.get('name'),
          $push: { _enabledPlugins: selectedMenu.get('name') } 
        }
      })
        .error(_.bind(this.onSaveError, this))
        .done(_.bind(this.onSaveSuccess, this));
    }
  }, {
    template: "editorMenuSettingsEdit"
  });

  return EditorMenuSettingsEditView;
});
