// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var ApiModel = require('core/models/apiModel');
  var Helpers = require('core/helpers');
  var Origin = require('core/origin');
  var ScaffoldFileView = require('modules/scaffold/views/scaffoldFileView');

  class AssetForm {
    constructor(options) {
      this.$container = options.$container;
      this.model = options.model || ApiModel.Asset();
      this.model.set('_type', 'asset');
      
      $('button.save', this.$container).on('click', this.save.bind(this));
      $('button.cancel', this.$container).on('click', this.remove.bind(this));

      this.render();
    }

    async render() {
      this.form = await Origin.scaffold.buildForm({ model: this.model });
      
      const input = new ScaffoldFileView({ schema: { file: { type: "File" }, editorClass: 'field' }, key: 'file' });
      input.$el.insertBefore($('.field', this.form.$el).first());
      input.render();

      $('.asset-management-form-preview', this.$container).empty();

      if(this.model.get('hasThumb')) {
        const thumbUrl = `/api/assets/serve/${this.model.get('_id')}?thumb=true&${Helpers.timestring(this.model.get('updatedAt'))}`;
        $('.asset-management-form-preview', this.$container).append(`<img src="${thumbUrl}" />`);
      }
      $('.asset-management-form-container', this.$container).append(this.form.el);
      this.$container.addClass('show');
    }

    async save() {
      this.form.commit();
      const model = this.form.model;
      const hasFile = !!$('input[name="file"]', this.form.$el).val();
      const hasChanged = Object.keys(model.changedAttributes()).filter(a => a !== '_type').length > 0;
      try {
        if(model.isNew() && !hasFile) {
          return Origin.Notify.toast({ type: 'error', text: Origin.l10n.t('app.pleaseaddfile') });
        }
        if(hasChanged) {
          if(!hasFile) { // don't upload empty file
            $('input[type="file"]', this.form.$el).remove();
          }
          const validationErrors = this.form.validate();
          if(validationErrors) {
            return Origin.Notify.toast({ 
              type: 'error', 
              title: Origin.l10n.t('app.validationfailed'),
              text: Object.values(validationErrors).map(e => `${e.title} ${e.type}`).join('<br/>')
            });
          }
          const newData = await Helpers.submitForm(this.form, {
            method: model.isNew() ? 'POST' : 'PATCH', 
            url: model.url(),
            beforeSubmit: this.sanitiseData
          });
          Origin.trigger('assetForm:close', undefined, ApiModel.Asset(newData));
          this.remove();
        }
      } catch(e) {
        Origin.trigger('assetForm:close', e);
      }
    }

    sanitiseData(formData) {
      const tags = formData.get('tags');
      tags.length ? formData.set('tags', JSON.stringify(tags.split(','))) : formData.delete('tags');
      if(!formData.get('url')) formData.delete('url');
    }

    remove() {
      $('button.save', this.$container).off('click');
      $('button.cancel', this.$container).off('click');
      this.$container.removeClass('show');
      this.form && this.form.remove();
      this.form = null;
      Origin.trigger('assetForm:close');
    }
  };

  return AssetForm;
});
