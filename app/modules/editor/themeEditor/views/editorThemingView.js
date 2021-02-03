// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var ContentPluginCollection = require('core/collections/contentPluginCollection');
  var EditorOriginView = require('../../global/views/editorOriginView');
  var Helpers = require('core/helpers');
  var Origin = require('core/origin');
  var PresetCollection = require('../collections/editorPresetCollection.js');
  var PresetEditView = require('./editorPresetEditView.js');

  var ThemingView = EditorOriginView.extend({
    tagName: 'div',
    className: 'theming',
    events: {
      'change .theme select': 'onThemeChanged',
      'change .preset select': 'onPresetChanged',
      'change .form-container form': 'updateRestorePresetButton',
      'click button.edit': 'showPresetEdit'
    },

    initialize: async function() {
      this.listenTo(Origin, {
        'editorThemingSidebar:views:save': this.saveData,
        'editorThemingSidebar:views:savePreset': this.onSavePresetClicked,
        'editorThemingSidebar:views:resetToPreset': this.restorePresetSettings,
        'managePresets:edit': this.onEditPreset,
        'managePresets:delete': this.onDeletePreset
      });
      await this.initData();
      EditorOriginView.prototype.initialize.apply(this, arguments);
      this.render();
    },

    initData: async function() {
      this.model = new Backbone.Model(Origin.editor.data.course.get('themeVariables'));
      this.themes = new ContentPluginCollection(undefined, { type: 'theme' });
      this.presets = new PresetCollection();
      
      await Promise.all([this.themes.fetch(), this.presets.fetch()]);

      this.listenTo(this.model, 'change', this.renderForm);
      this.listenTo(this.themes, 'change', this.updateThemeSelect);
      this.listenTo(this.presets, 'change', this.updatePresetSelect);
    },

    render: async function() {
      this.$el.hide();

      EditorOriginView.prototype.render.apply(this, arguments);

      Origin.trigger('location:title:update', {
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
      
      this.$('.theme-selector').addClass('show-preset-select');
      this.$('.empty-message').hide();
      this.$('.editable-theme').show();
      $('.editor-theming-sidebar-reset').show();
      try {
        this.schemaName = `${this.getSelectedTheme().get('theme')}-theme`;
        this.form = await Origin.scaffold.buildForm({ model: this.model, schemaType: this.schemaName });
        this.$('.form-container').html(this.form.el);

      } catch(e) {
        this.$('.theme-selector').removeClass('show-preset-select');
        this.$('.empty-message').show();
        this.$('.editable-theme').hide();
        $('.editor-theming-sidebar-reset').hide();
      }
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

      if(items.length) {
        items.forEach(i => $select.append($(`<option>`, i)));
      }
      $select.attr('disabled', !items.length);
      $select.val(value);
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

    restorePresetSettings: function(event) {
      event && event.preventDefault();
      Origin.Notify.confirm({
        type: 'warning',
        text: Origin.l10n.t('app.restorepresettext'),
        callback: confirmed => {
          if (confirmed) {
            this.updateRestorePresetButton(false);
            this.model.set(this.getSelectedPreset() || this.getDefaultThemeSettings());
          }
        }
      });
    },

    /**
    * Data persistence
    */

    validateForm: function() {
      if (!this.getSelectedTheme()) {
        Origin.Notify.alert({ type: 'error', text: Origin.l10n.t('app.errornothemeselected') });
        return false;
      }
      return true;
    },

    savePreset: function(presetName) {
      this.form.commit();
      new presetModel().save({
        displayName: presetName,
        parentTheme: this.getSelectedTheme().get('theme'),
        properties: this.form.model.attributes
      }, {
        success: () => {
          this.presets.add(presetModel);
          this.updateRestorePresetButton(false);
          window.setTimeout(() => this.$('.preset select').val(presetModel.get('_id')), 1);
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
        Origin.editor.data.course.save({ themeVariables: this.form.model.attributes }, { error: () => reject(), success: () => resolve() });
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
      if(presetId) return this.presets.findWhere({ _id: presetId });

      if(includeCached) return this.presets.findWhere({ _id: Origin.editor.data.config.get('_themePreset') });

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

    /**
    * Event handling
    */

    onEditPreset: function({ oldValue, newValue }) {
      this.presets.findWhere({ displayName: oldValue }).save({ displayName: newValue });
    },

    onDeletePreset: function(preset) {
      this.presets.findWhere({ displayName: preset }).destroy();
    },

    onError: function(collection, response, options) {
      Origin.Notify.alert({ type: 'error', text: response });
    },

    onThemeChanged: function() {
      this.updatePresetSelect();
      this.renderForm();
      this.updateRestorePresetButton(false);
    },

    onPresetChanged: function(event) {
      this.updateRestorePresetButton(false);
      this.model.set(this.getSelectedPreset() || this.getDefaultThemeSettings());
    },

    onSavePresetClicked: function() {
      Origin.Notify.alert({
        type: 'input',
        text: Origin.l10n.t('app.presetinputtext'),
        closeOnConfirm: false,
        showCancelButton: true,
        callback: presetName => {
          if(presetName === false) return // user cancel
          if(!presetName) return swal.showInputError(Origin.l10n.t('app.invalidempty')); // no falsies
          
          var presets = this.presets.where({ displayName: presetName, parentTheme: this.$('.theme select').val() });
          if(presets.length > 0) return swal.showInputError(Origin.l10n.t('app.duplicatepreseterror'));
          
          this.savePreset(Helpers.escapeText(presetName)); // escape text to avoid injection attacks
          swal.close();
        }
      });
    }
  }, {
    template: 'editorTheming'
  });

  return ThemingView;
});
