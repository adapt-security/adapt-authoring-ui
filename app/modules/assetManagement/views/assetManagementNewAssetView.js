// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define([
  'core/origin',
  'core/views/originView',
  'modules/scaffold/views/scaffoldFileView'
], function(Origin, OriginView, ScaffoldFileView){
  var AssetManagementNewAssetView = OriginView.extend({
    events: {
      'change .scaffold-file': 'updateTitle',
    },

    preRender: function() {
        this.listenTo(Origin, 'assetManagement:newAsset', this.save);
    },

    postRender: async function() {
      this.form = await Origin.scaffold.buildForm({ model: this.model, schemaType: 'asset' });

      const input = new ScaffoldFileView({ schema: { file: { type: "File" }, editorClass: 'field' }, key: 'file' });
      input.$el.insertBefore($('.field', this.form.$el).first());
      input.render();

      this.$el.append(this.form.el);
      
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

    save: function() {
      const errors = this.form.validate();
      if(errors) {
        return this.onError(`${Origin.l10n.t('app.validationfailedmessage')}<br/><br/>${this.buildErrorMessage(errors)}`);
      }
      const callbacks = { 
        success: () => Origin.router.navigateTo('assetManagement'),
        error: () => this.onError(Origin.l10n.t('app.errorassetupdate'))
      };
      if(this.model.isNew()) { // handle file upload
        this.form.$el.ajaxSubmit({
          method: 'POST',
          url: '/api/assets',
          beforeSubmit: function(dataArr) { // remove empty tags to avoid validation error
            const i = dataArr.findIndex(({ name }) => name === 'tags');
            if(dataArr[i].value === "") dataArr.splice(i, 1);
            else dataArr[i].value = JSON.stringify(dataArr[i].value.split(','));
          },
          uploadProgress: function(event, position, total, percentComplete) {
            $(".progress-container").css("visibility", "visible");
            var percentVal = percentComplete + '%';
            $(".progress-bar").css("width", percentVal);
            $('.progress-percent').html(percentVal);
          },
          success: (data, status, xhr) => {
            Origin.trigger('assets:update');
            this.model.set({_id: data._id});
            this.model.fetch().done(() => Origin.trigger('assetItemView:preview', this.model));
            Origin.router.navigateTo('assetManagement');
          },
          error: (xhr) => this.onError(xhr.responseJSON.message)
        });
        return;
      }      
      this.form.commit();
      model.save(this.model.changedAttributes(), callbacks);
    },

    onError: function(errorMessage) {
      Origin.trigger('sidebar:resetButtons');
      Origin.Notify.alert({ type: 'error', text: errorMessage });
    }

  }, {
    template: 'editor'
  });

  return AssetManagementNewAssetView;
});
