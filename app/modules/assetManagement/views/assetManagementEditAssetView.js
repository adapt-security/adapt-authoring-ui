// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define([
  'core/origin',
  'core/helpers',
  'core/views/originView',
  'modules/scaffold/views/scaffoldFileView'
], function(Origin, Helpers, OriginView, ScaffoldFileView){
  var AssetManagementEditAssetView = OriginView.extend({
    className: 'asset-management-edit-asset',
    events: {
      'change .scaffold-file': 'updateTitle',
    },

    preRender: function() {
      this.listenTo(Origin, 'assetManagement:editAsset', this.save);
      this.originalAttributes = _.clone(this.model.attributes);
    },

    postRender: async function() {
      this.model.set('_type', 'asset');
      this.form = await Origin.scaffold.buildForm({ model: this.model });

      const input = new ScaffoldFileView({ schema: { file: { type: "File" }, editorClass: 'field' }, key: 'file' });
      input.$el.insertBefore($('.field', this.form.$el).first());
      input.render();

      $('.form-container', this.$el).append(this.form.el);

      this.form.on('url:change', () => this.updateTitle());

      this.setViewToReady();
    },

    updateTitle: function(e) {
      if(!this.form.fields.title.getValue()) { // add the asset file name if there isn't already a title
        this.form.fields.title.setValue($(e.currentTarget).val().replace("C:\\fakepath\\", ""));
      }
    },

    buildErrorMessage: function(errors, message = "") {
      Object.values(errors).forEach((item, key) => {
        if(item.hasOwnProperty('message')) {
          message += `<span class="key">${item.title || key}</span>: ${item.message}<br/>`;
        } else if(_.isObject(item)) { // recurse
          message = this.buildErrorMessage(item, message);
        }
      });
      return message;
    },

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
          const _id = newData && newData._id;

          if(this.model.get('isModal')) {
            if(_id) Origin.trigger('assetManagement:collection:refresh', null, true, _id);
            Origin.trigger('assetManagement:modalEdit:remove');
            return;
          }
          Origin.router.navigateTo('assetManagement');
        }
      } catch(e) {
        Origin.trigger('sidebar:resetButtons');
        Origin.Notify.alert({ type: 'error', text: e.message });
      }
    },

    sanitiseData(formData) {
      const tags = formData.get('tags');
      tags?.length ? formData.set('tags', JSON.stringify(tags.split(','))) : formData.delete('tags');
      if(!formData.get('url')) formData.delete('url');
    }

  }, {
    template: 'assetManagementEditAsset'
  });

  return AssetManagementEditAssetView;
});
