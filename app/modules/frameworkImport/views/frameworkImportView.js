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
      Origin.trigger('contentHeader:updateTitle', { title: Origin.l10n.t('app.frameworkimporttitle') });
      this.listenTo(Origin, {
        'frameworkImport:check': this.checkCourse,
        'frameworkImport:import': this.importCourse
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
    
    importCourse: function() {
      if(!this.isValid()) return;
      this.doImport()
        .then(() => Origin.router.navigateToDashboard())
        .catch(this.onError.bind(this));
    },

    doImport: async function(dryRun = false) {
      Origin.trigger('sidebar:updateButton', 'button.frameworkimport', Origin.l10n.t('app.working'));

      if(this.model.get('tags')) {
        this.$('#tags').val(this.model.get('tags').map(t => t.title));
      }
      const data = await Helpers.submitForm(this.$('form.frameworkImport'), { data: { dryRun } })
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

    formatErrorString: function (errorString) {
      const normalise = (s, delim) => s.split(delim).map(s => s.trim()).filter(Boolean)
      const nl = count => '<br/>'.repeat(count ?? 1)

      // Extract prefix messages (anything before the first component error)
      const firstComponentIndex = errorString.search(/\S+-component\s+\S+/);
      const prefixMessages = firstComponentIndex > 0 
        ? normalise(errorString.substring(0, firstComponentIndex), ',')
        : [];
      const componentString = firstComponentIndex > 0 
        ? errorString.substring(firstComponentIndex) 
        : errorString;

      const components = normalise(componentString, ';')
      const groups = {};
      
      components.forEach(component => {
        const [, type, id, errorsStr] = component.match(/^(\S+-component)\s+(\S+)\s+(.+)$/) ?? [];

        if(!type || !id || !errorsStr) {
          return
        }
        // Split only on ", /" to avoid breaking apart value lists like "false,soft,hard"
        const errors = errorsStr
          .split(/,\s*(?=\/)/)
          .map(s => s.trim())
          .filter(Boolean)
          .sort();
        const signature = `${type}|${errors.join('|')}`;

        if (!groups[signature]) groups[signature] = { type, errors, ids: [] };
        groups[signature].ids.push(id);
      });  
      // Group by component type
      const byType = {};
      Object.values(groups).forEach(group => {
        if (!byType[group.type]) byType[group.type] = [];
        byType[group.type].push(group);
      });
    
      // Format output
      const output = [];
      // Add prefix messages if any
      if (prefixMessages.length) output.push(prefixMessages.join(', '));
      // Add component errors
      const formatted = Object.entries(byType).map(([type, typeGroups]) => {
        const totalCount = typeGroups.reduce((sum, g) => sum + g.ids.length, 0);
        const subGroups = typeGroups.map(group => {
          return `<div style="margin-bottom:20px;"><b>IDs:</b> ${group.ids.join(', ')}<ul style="text-align:left;margin-top:10px;">${group.errors.map(e => `<li>${e}</li>`).join('')}</ul></div>`;
        });
        return `<h2 style="margin:20px;">${type} (${totalCount})</h2><div>${subGroups.join('')}</div>`;
      });

      output.push(...formatted);

      return output.join('');
    },

    onError: function(e) {
      let text
      try {
        text = this.formatErrorString(e.message)
      } catch (e) {
        text = e.message
      }
      Origin.Notify.alert({ type: 'error', text });
      Origin.trigger('sidebar:resetButtons'); 
    }
  }, {
    template: 'frameworkImport'
  });

  return FrameworkImportView;
});
