define([
  'modules/assetManagement/collections/assetCollection',
  'modules/assetManagement/views/assetManagementModalView',
  'core/helpers',
  'core/origin'
], function(AssetCollection, AssetManagementModalView, Helpers, Origin) {
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
        error: () => Origin.Notify.alert({ type: 'error', text: Origin.l10n.t('app.errorsaveasset') })
      });
    },

    setValue: function(value) {
      Backbone.Form.editors.Base.prototype.setValue.call(this, value);
      this.render();
    },

    /**
    * Event handling
    */

    focus: function() {
      if (!this.hasFocus) this.$('input').focus();
    },

    blur: function() {
      if (this.hasFocus) this.$('input').blur();
    },

    onAssetButtonClicked: function(event) {
      event.preventDefault();

      Origin.trigger('modal:open', AssetManagementModalView, {
        collection: new AssetCollection,
        assetType: this.assetType,
        _shouldShowScrollbar: false,
        onUpdate: function(data) {
          if(data) {
            this.setValue(data.assetId);
            if(data._shouldAutofill) {
              Origin.trigger('scaffold:assets:autofill', data.assetId);
            }
          }
        }
      }, this);
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
