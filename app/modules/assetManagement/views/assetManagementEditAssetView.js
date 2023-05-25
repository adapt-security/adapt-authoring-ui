// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define([
  'core/origin',
  'core/views/originView',
  'modules/scaffold/views/scaffoldFileView'
], function(Origin, OriginView, ScaffoldFileView){
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

    sanitiseData: function(dataArr) {
      const isArray = Array.isArray(dataArr)
      if(!isArray) {
        dataArr = Object.entries(dataArr).map(([k,v]) => Object.create({ name: k, value: v }));
      }
      for (let i = 0; i < dataArr.length; i++) {
        const d = dataArr[i];
        if(d.name === "tags") {
          if(!d.value.length) dataArr.splice(i--, 1);
        } else if(d.name === "url" && d.value === "") {
          dataArr.splice(i--, 1);
        }
      }
      if(isArray) return dataArr;
      const data = dataArr.reduce((m, d) => Object.assign(m, { [d.name]: d.value }), {});
      if(Object.keys(data).length) return data;
    },

    getAttributesToSave: function() {
      var changedAttributes = this.model.changedAttributes(this.originalAttributes);
      // should also include anything that's new
      var newAttributes = _.omit(this.model.attributes, Object.keys(this.originalAttributes));
      _.extend(changedAttributes, newAttributes);

      if(!changedAttributes) {
        return null;
      }
      return _.pick(this.model.attributes, Object.keys(changedAttributes));
    },

    save: function() {
      const errors = this.form.validate();
      if(errors) {
        return this.onSaveError(`${Origin.l10n.t('app.validationfailedmessage')}<br/><br/>${this.buildErrorMessage(errors)}`);
      }
      const callbacks = {
        success: data => this.onSaveSuccess(data),
        error: (model, xhr) => {
          if(typeof xhr === 'string') xhr = model;
          this.onSaveError(xhr.responseJSON && xhr.responseJSON.message || xhr.statusText);
        }
      };
      if($('input[name="file"]').val()) { // handle file upload
        this.form.$el.ajaxSubmit(Object.assign({
          method: this.model.isNew() ? 'POST' : 'PATCH',
          url: `/api/assets/${this.model.get('_id') ? this.model.get('_id') : ''}`,
          beforeSubmit: this.sanitiseData,
        }, callbacks));
        return;
      }
      this.form.commit();
      const data = this.sanitiseData(this.getAttributesToSave());
      data ? this.model.save(data, Object.assign({ patch: !this.model.isNew() }, callbacks)) : this.onSaveSuccess();
    },

    onSaveSuccess: function(data) {
      if(data) {
        if(Array.isArray(data)) data = data [0];
        Origin.trigger('assetManagement:collection:refresh');
        this.model.set(data);
      }
      Origin.trigger('assetItemView:preview', this.model)
      Origin.router.navigateTo('assetManagement');
    },

    onSaveError: function(errorMessage) {
      Origin.trigger('sidebar:resetButtons');
      Origin.Notify.alert({ type: 'error', text: errorMessage });
    }

  }, {
    template: 'assetManagementEditAsset'
  });

  return AssetManagementEditAssetView;
});
