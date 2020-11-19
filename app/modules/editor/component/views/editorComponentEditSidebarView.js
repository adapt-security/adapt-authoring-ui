// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var SidebarItemView = require('modules/sidebar/views/sidebarItemView');

  var EditorComponentEditSidebarView = SidebarItemView.extend({
    events: {
      'click .editor-component-edit-sidebar-save': 'saveEditing',
      'click .editor-component-edit-sidebar-cancel': 'cancelEditing'
    },

    saveEditing: function(event) {
      event.preventDefault();
      this.updateButton('.editor-component-edit-sidebar-save', Origin.l10n.t('app.saving'));
      Origin.trigger('editorComponentEditSidebar:views:save');
    },

    cancelEditing: function(event) {
      event.preventDefault();
      const page = this.getParent(this.getParent(this.getParent(this.model)));
      Origin.router.navigateTo(`editor/${page.get('_courseId')}/page/${page.get('_id')}`);
    },

    getParent: function(model) {
      return Origin.editor.data.content.findWhere({ _id: model.get('_parentId') });
    }
  }, {
    template: 'editorComponentEditSidebar'
  });

  return EditorComponentEditSidebarView;
});
