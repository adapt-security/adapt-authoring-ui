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
      Origin.trigger('location:title:update', { title: Origin.l10n.t('app.frameworkimporttitle') });
      this.listenTo(Origin, {
        'frameworkImport:check': this.checkCourse,
        'frameworkImport:import': this.importcourse
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
      var $uploadFile = this.$('.asset-file');
      const isValid = $uploadFile.val() !== '';
      $uploadFile.toggleClass('input-error', !isValid);
      $('.field-file').find('span.error').text(isValid ? '' : Origin.l10n.t('app.pleaseaddfile'));
      return isValid;
    },

    checkCourse: async function() {
      if(!this.isValid()) return;
      this.doImport(true)
        .then(data => {
          $('button.frameworkimport-check').addClass('display-none');
          if(data.canImport) $('button.frameworkimport.import').removeClass('display-none');
          this.$el.html(Handlebars.templates.frameworkImportSummary(data));
        });
    },
    
    importCourse: function() {
      if(!this.isValid()) return;
      this.doImport()
        .then(() => Origin.router.navigateToDashboard());
    },

    doImport: async function(dryRun = false) {
      Origin.trigger('sidebar:updateButton', 'button.frameworkimport', Origin.l10n.t('app.working'));

      if(this.model.get('tags')) {
        this.$('#tags').val(this.model.get('tags').map(t => t._id));
      }
      return new Promise(async (resolve, reject) => {
        try {
          const data = await Helpers.submitForm(this.$('form.frameworkImport'), { extendedData: { dryRun } });
          resolve(Object.assign(data, { canImport: data.statusReport.error === undefined }));
        } catch(e) {
          reject(e);
        }
      });
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
    }
  }, {
    template: 'frameworkImport'
  });

  return FrameworkImportView;
});
