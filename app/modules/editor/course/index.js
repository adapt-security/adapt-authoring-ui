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
    Origin.contentPane.setView(EditorCourseEditView, { model: Origin.editor.data.course, form: form });
    Origin.sidebar.addView(new EditorCourseEditSidebarView({ form: form }).$el);
  }

  async function createNewCourse() {
    var model = new CourseModel();
    Origin.trigger('location:title:update', {
      breadcrumbs: ['dashboard'],
      title: Origin.l10n.t('app.editornew')
    });
    var form = await Origin.scaffold.buildForm({ model: model });
    Origin.contentPane.setView(EditorCourseEditView, { model: model, form: form });
    Origin.sidebar.addView(new EditorCourseEditSidebarView({ form: form }).$el);
  }
});
