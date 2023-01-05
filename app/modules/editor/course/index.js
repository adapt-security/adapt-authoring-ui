// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var CourseModel = require('core/models/courseModel');
  var EditorCourseEditSidebarView = require('./views/editorCourseEditSidebarView');
  var EditorCourseEditView = require('./views/editorCourseEditView');
  var EditorHelpers = require('../global/helpers');
  var Origin = require('core/origin');

  Origin.on('router:project', route1 => route1 === 'new' && createNewCourse());
  Origin.on('editor:course', renderCourseEdit);

  async function renderCourseEdit() {
    EditorHelpers.setPageTitle(Origin.editor.data.course);
    var form = await Origin.scaffold.buildForm({ model: Origin.editor.data.course });
    Origin.contentPane.setView(EditorCourseEditView, { model: Origin.editor.data.course, form });
    Origin.sidebar.addView(new EditorCourseEditSidebarView({ form }).$el);
  }

  async function createNewCourse() {
    var model = new CourseModel();
    Origin.trigger('contentHeader:updateTitle', { breadcrumbs: ['dashboard'], title: Origin.l10n.t('app.editornew') });
    Origin.contentHeader.setButtons(Origin.contentHeader.BUTTON_TYPES.ACTIONS, ACTION_BUTTON_TEMPLATES.EDIT_FORM);
    Origin.trigger('sidebar:sidebarContainer:hide');
    var form = await Origin.scaffold.buildForm({ model });
    Origin.contentPane.setView(EditorCourseEditView, { model, form });
    Origin.sidebar.addView(new EditorCourseEditSidebarView({ form }).$el);
  }
});
