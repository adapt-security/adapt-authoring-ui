// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/**
 * This module handles both sections/menus and pages.
 */
define(function(require) {
  var ContentObjectModel = require('core/models/contentObjectModel');
  var ContentPluginCollection = require('core/collections/contentPluginCollection');
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
      Origin.editor.data.componentTypes = new ContentPluginCollection(undefined, { type: 'component' });
      Origin.editor.data.componentTypes.fetch({
        success: () => data.id ? renderPageStructure(data) : renderMenuStructure(data)
      });
    }
    if(!data.id) {
      return route();
    }
    (new ContentObjectModel({ _id: data.id })).fetch({
      success: function(model) {
        data.model = model;
        Helpers.setPageTitle(model);
        route();
      }
    });
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
      backButtonRoute: Origin.dashboardRoute || '#/dashboard'
    });
    Origin.contentPane.setView(EditorView, {
      currentCourseId: Origin.location.route1,
      currentView: 'menu',
      currentPageId: data.id
    });
  }
});
