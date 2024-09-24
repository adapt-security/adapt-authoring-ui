// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');
  var Helpers = require('core/helpers');

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
      try {
        const data = await this.doImport(true);
        $('button.frameworkimport.check').addClass('display-none');
        if(data.canImport) $('button.frameworkimport.import').removeClass('display-none');
        this.$('#import_upload').addClass('display-none');
        this.$el.append(Handlebars.templates.frameworkImportSummary(this.transformStatusData(data)));
      } catch(e) {
        this.onError(e);
      } finally {
        Origin.trigger('sidebar:resetButtons');
      }
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

    transformStatusData: function(data) {
      const STATUS_MAP = {
        "NO_CHANGE": Origin.l10n.t("app.import.plugins.status.NO_CHANGE"),
        "UPDATED": Origin.l10n.t("app.import.plugins.status.UPDATED"),
        "MANAGED_PLUGIN_UPDATE_DISABLED": Origin.l10n.t("app.import.status.MANAGED_PLUGIN_UPDATE_DISABLED"),
        "MISSING_PLUGINS": Origin.l10n.t("app.import.status.MISSING_PLUGINS"),
      };
      Object.values(data.statusReport).forEach(messages => {
        messages.forEach(m => m.text = STATUS_MAP[m.code]);
      });
      data.versions.forEach(v => v.statusText = STATUS_MAP[v.status]);
    },
    
    importCourse: function() {
      if(!this.isValid()) return;
      this.doImport()
        .then(() => Origin.router.navigateToDashboard())
        .catch(this.onError);
    },

    doImport: async function(dryRun = false) {
      if(this.model.get('tags')) {
        this.$('#tags').val(this.model.get('tags').map(t => t.title));
      }
      const data = await Helpers.submitForm(this.$('form.frameworkImport'), { extendedData: { dryRun } })
      return Object.assign(data, { canImport: data.statusReport.error === undefined });
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

    onError: function(e) {
      Origin.Notify.alert({ type: 'error', text: e.message });
    }
  }, {
    template: 'frameworkImport'
  });

  return FrameworkImportView;
});
