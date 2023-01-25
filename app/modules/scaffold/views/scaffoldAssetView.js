define([
  'backbone',
  'backboneForms',
  'core/helpers',
  'core/origin',
  'modules/assetManagement/views/assetManagementView'
], function(Backbone, BackboneForms, Helpers, Origin, AssetManagementView) {
  var ScaffoldAssetView = Backbone.Form.editors.Base.extend({
    assetType: null,
    events: {
      'change input': function() { this.trigger('change', this); },
      'focus input': function() { this.trigger('focus', this); },
      'blur input': function() { this.trigger('blur', this); },
      'click .scaffold-asset-picker': 'onAssetButtonClicked',
      'click .scaffold-asset-clear': 'onClearButtonClicked',
      'click .scaffold-asset-external': 'onExternalAssetButtonClicked',
      'click .scaffold-asset-external-input-save': 'onExternalAssetSaveClicked',
      'click .scaffold-asset-external-input-cancel': 'onExternalAssetCancelClicked',
    },

    initialize: function(options) {
      Backbone.Form.editors.Base.prototype.initialize.call(this, options);
      this.listenTo(Origin, 'scaffold:assets:autofill', this.setValue);
      this.setValue(this.value);
    },

    render: function() {
      this.renderData();
      return this;
    },

    renderData: async function() {
      this.assetType = this.schema.inputType.media || this.schema.inputType.replace(/Asset|:/g, '');

      let url = thumbUrl = this.value;
      
      if(!Helpers.isAssetExternal(this.value)) {
        url = `api/assets/serve/${this.value}`;
        thumbUrl = `${url}?thumb=true`;
      }
      const template = Handlebars.templates[this.constructor.template];
      this.$el.html(template({ value: this.value, type: this.assetType, url, thumbUrl }));
    },

    checkValueHasChanged: function() {
      var value = this.getValue();
      if (this.key === 'heroImage') return this.saveModel({ heroImage: value });
      if (Helpers.isAssetExternal(value)) return this.saveModel();
    },

    saveModel: function(attributesToSave) {
      var currentModel = Origin.scaffold.getCurrentModel();
      var alternativeModel = Origin.scaffold.getAlternativeModel();
      var alternativeAttribute = Origin.scaffold.getAlternativeAttribute();
      // Check if alternative model should be used
      if (alternativeModel) {
        currentModel = alternativeModel;
      }
      // run schema validation
      Origin.scaffold.getCurrentForm().commit({ validate: false });
      // Check if alternative attribute should be used
      if (alternativeAttribute) {
        attributesToSave[alternativeAttribute] = Origin.scaffold.getCurrentModel().attributes;
      }
      if (!attributesToSave) {
        currentModel.pruneAttributes();
      }
      currentModel.save(attributesToSave, {
        patch: attributesToSave !== undefined,
        success: () => this.trigger('change', this),
        error: () => Origin.Notify.toast({ type: 'error', text: Origin.l10n.t('app.errorsaveasset') })
      });
    },

    setValue: function(value) {
      Backbone.Form.editors.Base.prototype.setValue.call(this, value);
      this.render();
    },
    
    getValue: function() {
      return Backbone.Form.editors.Base.prototype.getValue.call(this) || undefined;
    },

    // Event handling

    focus: function() {
      if (!this.hasFocus) this.$('input').focus();
    },

    blur: function() {
      if (this.hasFocus) this.$('input').blur();
    },

    onAssetButtonClicked: function(event) {
      event.preventDefault();

      Origin.modal.setView({ 
        view: new AssetManagementView(),
        header: { 
          title: Origin.l10n.t('app.selectasset'), 
          buttons: Object.assign(AssetManagementView.contentHeaderButtons, {
            actions: [{
              items: [
                {
                  id: 'done',
                  buttonText: Origin.l10n.t('app.done'),
                },
                {
                  id: 'autofill',
                  buttonText: Origin.l10n.t('app.autofill'),
                  buttonClass: 'secondary-hollow'
                },
                {
                  id: 'close',
                  buttonText: Origin.l10n.t('app.cancel'),
                  buttonClass: 'action-secondary'
                }
              ]
            }],
          })
        }
      });
      Origin.on('modal:actions', action => {
        Origin.modal.close();
        const selected = Origin.modal.view.collectionView.getSelected();
        if(action === 'cancel' || !selected) {
          return;
        }
        if(action === 'autofill') Origin.trigger('scaffold:assets:autofill', selected.get('_id'));
        if(action === 'done') this.setValue(selected.get('_id'));
      });
    },

    onClearButtonClicked: function(event) {
      event.preventDefault();

      this.checkValueHasChanged();
      this.setValue('');
    },

    onExternalAssetButtonClicked: function(event) {
      event.preventDefault();

      this.toggleExternalAssetField(true);
    },

    onExternalAssetSaveClicked: function(event) {
      event.preventDefault();

      var inputValue = this.$('.scaffold-asset-external-input-field').val();

      if (!inputValue.length) return this.toggleExternalAssetField(false);

      this.setValue(inputValue);
    },

    onExternalAssetCancelClicked: function(event) {
      event.preventDefault();

      this.toggleExternalAssetField(false);
    },

    toggleExternalAssetField: function(shouldShow) {
      this.$('.scaffold-asset-external-input').toggleClass('display-none', !shouldShow);
      this.$('.scaffold-asset-buttons').toggleClass('display-none', shouldShow);
    }

  }, { template: 'scaffoldAsset' });

  Origin.on('origin:dataReady', function() {
    Origin.scaffold.addCustomField('Asset:image', ScaffoldAssetView);
    Origin.scaffold.addCustomField('Asset:audio', ScaffoldAssetView);
    Origin.scaffold.addCustomField('Asset:video', ScaffoldAssetView);
    Origin.scaffold.addCustomField('Asset:other', ScaffoldAssetView);
    Origin.scaffold.addCustomField('Asset', ScaffoldAssetView);
  });

  return ScaffoldAssetView;

});
