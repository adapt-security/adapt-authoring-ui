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
      this.listenTo(Origin, 'scaffold:assets:autofill', this.onAutofill);
      Backbone.Form.editors.Base.prototype.initialize.call(this, options);
    },

    render: function() {
      this.setValue(this.value);
      this.renderData();
      return this;
    },

    renderData: function(id) {
      var inputType = this.schema.inputType;
      var dataUrl = Helpers.isAssetExternal(this.value) ? this.value : '';

      this.assetType = typeof inputType === 'string' ?
        inputType.replace(/Asset|:/g, '') :
        inputType.media;

      this.$el.html(Handlebars.templates[this.constructor.template]({
        value: this.value,
        type: this.assetType,
        url: id ? `api/assets/serve/${id}`: dataUrl,
        thumbUrl: id ? `api/assets/serve/${id}?thumb=true` : dataUrl
      }));
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
        success: () => {
          this.render();
          this.trigger('change', this);
        },
        error: () => Origin.Notify.alert({ type: 'error', text: Origin.l10n.t('app.errorsaveasset') })
      });
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
          if (!data) {
            return;
          }
          if (this.key === 'heroImage') {
            this.setValue(data.assetId);
            this.saveModel({ heroImage: data.assetId });
            return;
          }
          // all ScaffoldAssetViews listen to the autofill event, so we trigger that rather than call code directly
          if (data._shouldAutofill) {
            var courseAssetObject = {
              contentId: Origin.scaffold.getCurrentModel().get('_id') || '',
              assetId: data.assetId
            };
            Origin.trigger('scaffold:assets:autofill', courseAssetObject, data.assetLink);
            return;
          }
          this.setValue(data.assetLink);
        }
      }, this);
    },

    onClearButtonClicked: function(event) {
      event.preventDefault();

      this.checkValueHasChanged();
      this.setValue('');
    },

    onAutofill: function(courseAssetObject, value) {
      this.setValue(value);
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
      this.saveModel();
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
