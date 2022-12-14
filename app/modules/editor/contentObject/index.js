// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/**
 * This module handles both sections/menus and pages.
 */
define(function(require) {
  var EditorMenuSidebarView = require('./views/editorMenuSidebarView');
  var EditorPageEditSidebarView = require('./views/editorPageEditSidebarView');
  var EditorPageEditView = require('./views/editorPageEditView');
  var EditorPageSidebarView = require('./views/editorPageSidebarView');
  var EditorView = require('../global/views/editorView');
  var Helpers = require('../global/helpers');
  var Origin = require('core/origin');

  Origin.on('editor:contentObject', function(data) {
    var route = function() {
      if(data.action === 'edit') {
        return renderContentObjectEdit(data);
      }
      if(data.id) {
        return renderPageStructure(data);
      } 
      renderMenuStructure(data);
    }
    if(!data.id) {
      return route();
    }
    data.model = Origin.editor.data.content.findWhere({ _id: data.id });
    Helpers.setPageTitle(data.model);
    route();
  });

  async function renderContentObjectEdit(data) {
    Helpers.setPageTitle(data.model);
    var form = await Origin.scaffold.buildForm({ model: data.model });
    Origin.sidebar.addView(new EditorPageEditSidebarView({ form: form }).$el);
    Origin.contentPane.setView(EditorPageEditView, { model: data.model, form: form });
  }

  function renderPageStructure(data) {
    Helpers.setPageTitle(data.model);

    Origin.sidebar.addView(new EditorPageSidebarView().$el, {
      backButtonText: Origin.l10n.t('app.backtomenu'),
      backButtonRoute: "#/editor/" + Origin.location.route1 + "/menu"
    });
    Origin.contentPane.setView(EditorView, {
      currentCourseId: Origin.location.route1,
      currentView: 'page',
      currentPageId: data.id
    });
  }

  function renderMenuStructure(data) {
    Helpers.setPageTitle(Origin.editor.data.course);

    Origin.editor.scrollTo = 0;

    Origin.sidebar.addView(new EditorMenuSidebarView().$el, {
      backButtonText: Origin.l10n.t('app.backtoprojects'),
      backButtonRoute: '#/projects'
    });
    Origin.contentPane.setView(EditorView, {
      currentCourseId: Origin.location.route1,
      currentView: 'menu',
      currentPageId: data.id
    });
  }
});
