// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var ApiCollection = require('core/collections/apiCollection');
  var ApiModel = require('core/models/apiModel');
  var Backbone = require('backbone');
  var Helpers = require('core/helpers');
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');
  var PresetEditView = require('./editorPresetEditView.js');

  var ThemingView = OriginView.extend({
    tagName: 'div',
    className: 'theming',
    events: {
      'change .theme select': 'onThemeChanged',
      'change .preset select': 'resetFormSettings',
      'change .form-container form': 'updateRestorePresetButton',
      'click button.edit': 'showPresetEdit'
    },

    initialize: async function() {
      this.listenTo(Origin, {
        'actions:cancel': this.navigateBack,
        'actions:restorepreset': this.resetFormSettings,
        'actions:save': this.saveData,
        'actions:savepreset': this.onSavePresetClicked,
        'managePresets:edit': this.onEditPreset,
        'managePresets:delete': this.onDeletePreset
      });
      await this.initData();
      OriginView.prototype.initialize.apply(this, arguments);
      this.render();
    },

    initData: async function() {
      this.model = new Backbone.Model(Origin.editor.data.course.get('themeVariables'));
      this.themes = ApiCollection.ContentPlugins({ customQuery: { type: 'theme' } });
      this.presets = ApiCollection.CourseThemePresets();
      
      await Promise.all([this.themes.fetch(), this.presets.fetch()]);

      this.listenTo(this.model, 'change', this.renderForm);
      this.listenTo(this.themes, 'change', this.updateThemeSelect);
      this.listenTo(this.presets, 'change', this.updatePresetSelect);
    },

    render: async function() {
      this.$el.hide();

      OriginView.prototype.render.apply(this, arguments);

      Origin.contentHeader.setTitle({
        breadcrumbs: ['dashboard','course', { title: Origin.l10n.t('app.themeeditor') }],
        title: Origin.l10n.t('app.themingtitle')
      });
      await this.renderForm();
      this.updateThemeSelect();
      this.updatePresetSelect();
      this.updateRestorePresetButton();
      this.setViewToReady();

      this.$el.show();
    },

    renderForm: async function() {
      this.removeForm();
      let didError = false;
      try {
        this.schemaName = `${this.getSelectedTheme().get('targetAttribute').slice(1)}-theme`;
        this.form = await Origin.scaffold.buildForm({ model: this.model, schemaType: this.schemaName });
        this.$('.form-container').html(this.form.el);  
      } catch(e) {
        didError = true;
      }
      this.$('.theme-selector').toggleClass('show-preset-select', !didError);
      this.$('.empty-message').toggle(didError);
      this.$('.editable-theme').toggle(!didError);
      $('.editor-theming-sidebar-reset').toggle(!didError);
      
      this.$el.find('fieldset:not(:has(>.field))').addClass('empty-fieldset');
      this.$('.theme-customiser').show();
      Origin.trigger('theming:showPresetButton', true);
      // HACK defer needed to allow colour pickers to render
      return new Promise((resolve) => _.defer(() => resolve()));
    },

    removeForm: function() {
      this.$('.form-container').empty();
      this.$('.theme-customiser').hide();

      this.form = null;

      Origin.trigger('theming:showPresetButton', false);
    },

    updateSelect: function({ className, items, value }) {
      var $select = this.$(`.${className} select`);
      $('option', $select).remove();
      if(items.length) items.forEach(i => $select.append($(`<option>`, i)));
      $select.attr({ disabled: !items.length, value });
    },

    updateThemeSelect: function() {
      this.updateSelect({
        className: 'theme',
        value: this.getSelectedTheme().get('name'),
        items: [
          { value: "", disabled: 'disabled', text: Origin.l10n.t('app.selectinstr') },
          ...this.themes.where({ isEnabled: true }).map(t => Object({ value: t.get('name'), text: t.get('displayName') }))
        ]
      });
    },

    updatePresetSelect: function() {
      var theme = this.$('.theme select').val();
      var presets = this.presets.where({ parentTheme: theme });
      var selectedPresetId = this.getSelectedPreset(undefined, '_id');

      this.updateSelect({
        className: 'preset',
        value: selectedPresetId,
        items: [
          { value: "", text: Origin.l10n.t('app.nopresets') },
          ...presets.map(t => Object({ value: t.get('_id'), text: t.get('displayName') }))
        ]
      });
      presets.length ? this.$('button.edit').show() : this.$('button.edit').hide();
    },

    showPresetEdit: function(event) {
      event && event.preventDefault();
      var presets = new Backbone.Collection(this.presets.where({ parentTheme: this.getSelectedTheme().get('theme') }));
      var view = new PresetEditView({ model: new Backbone.Model({ presets }) });
      $('body').append(view.el);
    },
    
    resetFormSettings: function() {
      this.updateRestorePresetButton(false);
      this.model.set(this.getSelectedPreset() || this.getDefaultThemeSettings());
    },

    // Data persistence

    validateForm: function() {
      if (!this.getSelectedTheme()) {
        Origin.Notify.toast({ type: 'warning', text: Origin.l10n.t('app.errornothemeselected') });
        return false;
      }
      return true;
    },

    savePreset: function(presetName) {
      this.form.commit();
      ApiModel.CourseThemePreset().save({
        displayName: presetName,
        parentTheme: this.getSelectedTheme().get('name'),
        properties: this.model.attributes
      }, {
        success: model => {
          this.presets.add(model);
          this.updateRestorePresetButton(false);
          window.setTimeout(() => this.$('.preset select').val(model.get('_id')), 1);
        },
        error: this.onError
      });
    },

    saveData: async function(event) {
      event && event.preventDefault();

      if (!this.validateForm()) {
        return Origin.trigger('sidebar:resetButtons');
      }
      try {
        await this.postThemeData();
        await this.postPresetData();
        await this.postSettingsData();
        Origin.trigger('editingOverlay:views:hide');
        Origin.trigger('editor:refreshData', this.navigateBack.bind(this), this);

      } catch(e) {
        this.onError(undefined, Origin.l10n.t('app.errorsave'));
        this.navigateBack();
      }
    },

    postThemeData: function() {
      const oldTheme = Origin.editor.data.config.get('_theme');
      const newTheme = this.getSelectedTheme().get('name');
      if(newTheme === oldTheme) {
        return;
      }
      return $.ajax({
        url: `api/content/${Origin.editor.data.config.get('_id')}`,
        method: 'PATCH',
        data: { 
          _theme: newTheme,
          _enabledPlugins: [...Origin.editor.data.config.get('_enabledPlugins').filter(p => p !== oldTheme), newTheme]
        }
      });
    },

    postPresetData: function() {
      var selectedPresetId = this.getSelectedPreset(false, '_id');
      if(!selectedPresetId) return Promise.resolve();
      return $.post(`api/coursethemepresets/${selectedPresetId}/apply/${Origin.editor.data.config.get('_courseId')}`);
    },

    postSettingsData: function() {
      return new Promise((resolve, reject) => {
        if(!this.form) return resolve();
        this.form.commit();
        Origin.editor.data.course.save({ themeVariables: this.model.attributes }, { error: () => reject(), success: () => resolve() });
      });
    },

    navigateBack: function(event) {
      event && event.preventDefault();
      Backbone.history.history.back();
      this.remove();
    },

    getSelectedTheme: function() {
      return this.themes.findWhere({ name: $('select#theme', this.$el).val() || Origin.editor.data.config.get('_theme') });
    },
    // param used to only return the val() (and ignore model data)
    getSelectedPreset: function(includeCached = true, key = 'properties') {
      var $select = $('select#preset', this.$el);
      var presetId = $select && $select.val();
      var preset = this.presets.findWhere({ _id: presetId ? presetId : includeCached && Origin.editor.data.config.get('_themePreset') })
      return preset && preset.get(key);
    },

    getDefaultThemeSettings: function() {
      const getSchemaDefaults = (m, o) => {
        Object.entries(o).forEach(([k,v]) => m[k] = v.subSchema ? getSchemaDefaults({}, v.subSchema) : v.default);
        return m;
      };
      return getSchemaDefaults({}, this.form.schema);
    },

    getCurrentSettings: function() {
      return !this.form ? this.model.attributes : _.mapObject(this.form.fields, field => field.getValue());
    },

    updateRestorePresetButton: function(shouldShow) {
      if(typeof shouldShow === 'undefined') { // no flag, so determine button visibility based on changed settings
        shouldShow = !_.isEqual(this.getSelectedPreset() || this.getDefaultThemeSettings(), this.getCurrentSettings());
      }
      $('.editor-theming-sidebar-reset').css('visibility', shouldShow ? 'visible' : 'hidden');
    },

    // Event handling

    onEditPreset: function({ oldValue, newValue }) {
      this.presets.findWhere({ displayName: oldValue }).save({ displayName: newValue });
    },

    onDeletePreset: function(preset) {
      this.presets.findWhere({ displayName: preset }).destroy();
    },

    onError: function(collection, response, options) {
      Origin.Notify.toast({ type: 'error', text: response });
    },

    onThemeChanged: function() {
      this.updatePresetSelect();
      this.renderForm();
      this.updateRestorePresetButton(false);
    },

    onSavePresetClicked: function() {
      Origin.Notify.alert({
        type: 'input',
        text: Origin.l10n.t('app.presetinputtext'),
        preConfirm: presetName => {
          let msg;
          if(!presetName) {
            msg = Origin.l10n.t('app.invalidempty'); // no falsies
          }
          if(this.presets.findWhere({ displayName: presetName, parentTheme: this.$('.theme select').val() })) {
            msg = Origin.l10n.t('app.duplicatepreseterror'); // name already exists
          }
          if(msg) {
            Origin.Notify.Swal.showValidationMessage(msg);
            return false;
          }
        }, // escape text to avoid injection attacks
        callback: ({ value, isConfirmed }) => isConfirmed && this.savePreset(Helpers.escapeText(value))
      });
    }
  }, {
    template: 'editorTheming'
  });

  return ThemingView;
});