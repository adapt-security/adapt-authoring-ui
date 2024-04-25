// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');
  var Helpers = require('core/helpers');
  var SweetAlert = require('libraries/sweetalert2-11.1.7.all.min.js');

  var FrameworkImportView = OriginView.extend({
    tagName: 'div',
    className: 'frameworkImport',
    createdCourseId: false,

    preRender: function() {
      Origin.contentHeader.setTitle({ 
        breadcrumbs: [{ title: Origin.l10n.t('app.projects'), url: 'projects' }], 
        title: Origin.l10n.t('app.frameworkimporttitle') 
      });
      this.listenTo(Origin, {
        'actions:check': this.checkCourse,
        'actions:import': this.importCourse,
        'actions:cancel': () => Origin.router.navigateToDashboard()
      });
    },

    postRender: function() {
      // tagging
      this.$('#tags_control').tagsInput({
        autocomplete_url: 'api/tags/autocomplete',
        onAddTag: this.onAddTag.bind(this),
        onRemoveTag: this.onRemoveTag.bind(this),
        minChars : 3,
        maxChars : 30
      });
      this.setViewToReady();
    },

    isValid: function() {
      if(this.$('.asset-file').val() === '') {
        return Origin.Notify.toast({ type: 'error', text: Origin.l10n.t('app.pleaseaddfile') });
      }
      return true;
    },

    checkCourse: async function() {
      if(!this.isValid()) return;
      this.doImport(true)
        .then(data => {

          if (data.courseLastUpdated || data.courseLastUpdatedBy) {
            Origin.Notify.alert({
              title: Origin.l10n.t('app.importlastupdatedtitle'),
              text: Origin.l10n.t('app.importlastupdated', {user: data.courseLastUpdatedBy||'unknown user', time: data.courseLastUpdated||'time unknown'})
            })
          }

          this.transformStatusData(data);
          $('.actions button.check').addClass('display-none');
          if(data.canImport) $('.actions button.import').removeClass('display-none');
          this.$('#import_upload').addClass('display-none');
          this.$el.append(Handlebars.templates.frameworkImportSummary(data));
        })
        .catch(this.onError)
    },

    transformStatusData: function(data) {
      Object.values(data.statusReport).forEach(v => {
        v.forEach(v2 => v2.codeKey = `app.import.status.${v2.code}`);
      });
      Object.values(data.versions).forEach(v => {
        v.statusKey = `app.import.status.${v.status}`;
      });
      return data;
    },

    showAlert: function() {
      Origin.Notify.alert({
        type: 'info',
        title: Origin.l10n.t('app.importwaittitle'),
        text: Origin.l10n.t('app.importwaitbody'),
        showConfirmButton: false
      });
    },
    
    importCourse: function() {
      if(!this.isValid()) return;
      this.showAlert();
      this.doImport()
        .then(this.onSuccess)
        .catch(this.onError);
    },

    doImport: async function(dryRun = false) {
      if(this.model.get('tags')) {
        this.$('#tags').val(this.model.get('tags').map(t => t._id));
      }
      const data = await Helpers.submitForm(this.$('form.frameworkImport'), { data: { dryRun } })
      const canProceed = data.statusReport.error === undefined
      return Object.assign(data, { canUpdate: canProceed && data.isUpdate, canImport: canProceed });
    },

    onAddTag: function (tag) {
      $.ajax({ url: 'api/tags', method: 'POST', data: { title: tag } })
        .done(data => {
          const tags = this.model.get('tags') || [];
          this.model.set({ tags: [...tags, { _id: data._id, title: data.title }] });
        });
    },

    onRemoveTag: function (tag) {
      var tags = [];
      _.each(this.model.get('tags'), function (item) {
        if (item.title !== tag) {
          tags.push(item);
        }
      });
      this.model.set({ tags: tags });
    },

    onSuccess: function() {
      SweetAlert.close();
      Origin.router.navigateToDashboard()
    },

    onError: function(e) {
      const errorJson = JSON.parse(e.message);
      const title = errorJson.title;
      const text = errorJson.text;
      const debugInfo = errorJson.data;

      delete errorJson.title;
      delete errorJson.text;

      Origin.Notify.alert({
        title,
        html: `<p>${text}</p><pre>${JSON.stringify(debugInfo, undefined, 2)}</pre>`,
        customClass: {
          popup: 'frameworkImport'
        }
      })
    }
  }, {
    template: 'frameworkImport'
  });

  return FrameworkImportView;
});
