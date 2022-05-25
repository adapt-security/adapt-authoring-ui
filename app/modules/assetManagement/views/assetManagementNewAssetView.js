// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define([
  'core/origin',
  'core/views/originView',
  'modules/scaffold/views/scaffoldFileView'
], function(Origin, OriginView, ScaffoldFileView){
  var AssetManagementNewAssetView = OriginView.extend({
    className: 'asset-management-new-asset',
    events: {
      'change .scaffold-file': 'updateTitle',
    },

    preRender: function() {
      this.listenTo(Origin, 'assetManagement:newAsset', this.save);
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

    sanitiseData: function(dataArr) {
      for (let i = 0; i < dataArr.length; i++) {
        const d = dataArr[i];
        if(d.name === "tags") {
          if(d.value === "") dataArr.splice(i--, 1);
          d.value = JSON.stringify(d.value.split(','));
        } else if(d.name === "url" && d.value === "") {
          dataArr.splice(i--, 1);
        }
      }
    },

    save: function() {
      const errors = this.form.validate();
      if(errors) {
        return this.onSaveError(`${Origin.l10n.t('app.validationfailedmessage')}<br/><br/>${this.buildErrorMessage(errors)}`);
      }
      const callbacks = { 
        success: () => Origin.router.navigateTo('assetManagement'),
        error: () => this.onSaveError(Origin.l10n.t('app.errorassetupdate'))
      };
      if($('input[name="file"]').val()) { // handle file upload
        this.form.$el.ajaxSubmit({
          method: this.model.isNew() ? 'POST' : 'PATCH',
          url: `/api/assets/${this.model.get('_id') ? this.model.get('_id') : ''}`,
          beforeSubmit: this.sanitiseData,
          success: (data) => this.onSaveSuccess(data),
          error: (xhr) => this.onSaveError(xhr.responseJSON.message)
        });
        return;
      }      
      this.form.commit();
      this.model.save(this.model.changedAttributes(), callbacks);
    },

    onSaveSuccess: function([data]) {
      Origin.trigger('assetManagement:collection:refresh');
      this.model.set(data);
      Origin.trigger('assetItemView:preview', this.model)
      Origin.router.navigateTo('assetManagement');
    },

    onSaveError: function(errorMessage) {
      Origin.trigger('sidebar:resetButtons');
      Origin.Notify.alert({ type: 'error', text: errorMessage });
    }

  }, {
    template: 'assetManagementNewAsset'
  });

  return AssetManagementNewAssetView;
});
