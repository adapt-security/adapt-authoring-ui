define([
  'core/origin',
  'core/helpers',
  'backbone-forms',
  'backbone-forms-lists',
  './backboneFormsOverrides',
  './views/scaffoldAssetView',
  './views/scaffoldAssetItemView',
  './views/scaffoldCodeEditorView',
  './views/scaffoldColourPickerView',
  './views/scaffoldDisplayTitleView',
  './views/scaffoldItemsModalView',
  './views/scaffoldListView',
  './views/scaffoldTagsView',
  './views/scaffoldUsersView'
], function(Origin, Helpers, BackboneForms, BackboneFormsLists, Overrides, ScaffoldAssetView, ScaffoldAssetItemView, ScaffoldCodeEditorView, ScaffoldColourPickerView, ScaffoldDisplayTitleView, ScaffoldItemsModalView, ScaffoldListView, ScaffoldTagsView, ScaffoldUsersView) {

  var Scaffold = {};
  var alternativeModel;
  var alternativeAttribute;
  var currentModel;
  var currentForm;
  var ActiveItemsModal = 0;
  var isOverlayActive = false;
  var defaultValidators = Object.keys(Backbone.Form.validators);
  var customValidators = [];
  var customTemplates = [];

  Backbone.Form.editors.List.Modal.ModalAdapter = ScaffoldItemsModalView;

  function generateFieldObject(field, key) {
    var fieldType = field.type;
    var isFieldTypeObject = fieldType === 'object';
    var items = field.items;
    var itemsProperties = items && items.properties;
    var confirmDelete = Origin.l10n.t('app.confirmdelete');
    var formsConfig = field._backboneForms || {};

    var getType = function(item) {
      if (!item) {
        item = field;
      }
      var config = item._backboneForms;
      var editor = typeof config === 'string' ? config : config && config.type;

      if (editor) {
        return editor;
      }
      switch (item.type) {
        case 'array':
          return 'List';
        case 'boolean':
          return 'Checkbox';
        case 'number':
          return 'Number';
        case 'object':
          return 'Object';
        case 'string':
          return 'Text';
      }
    };

    var getValidators = function() {
      var validators = formsConfig.validators || [];

      for (var i = 0, j = validators.length; i < j; i++) {
        var validator = validators[i];

        if (!validator) continue;

        var isDefaultValidator = !Array.isArray(validator) && _.isObject(validator) ||
          _.contains(defaultValidators, validator);

        if (isDefaultValidator) continue;

        var customValidator = _.findWhere(customValidators, { name: validator });

        if (customValidator) {
          validators[i] = customValidator.validatorMethod;
          continue;
        }

        validators[i] = '';

        console.log('No validator of that sort – please register "' + validator +
          '" by using Origin.scaffold.addCustomValidator("' + validator +
          '", validatorMethod);');
      }

      return validators.filter(Boolean);
    };

    var fieldObject = {
      confirmDelete: itemsProperties ? confirmDelete : formsConfig.confirmDelete,
      default: field.default,
      editorAttrs: formsConfig.editorAttrs,
      editorClass: formsConfig.editorClass,
      fieldAttrs: formsConfig.fieldAttrs,
      fieldClass: formsConfig.fieldClass,
      help: field.description,
      itemType: itemsProperties ? 'Object' : items && getType(items),
      inputType: formsConfig.type ? formsConfig : getType(),
      options: field.enum,
      subSchema: isFieldTypeObject ? field.properties : itemsProperties || items,
      title: field.title,
      titleHTML: formsConfig.titleHTML,
      type: getType(),
      validators: getValidators()
    };
    return fieldObject;
  }

  function setUpSchemaFields(field, key, schema, scaffoldSchema) {
    scaffoldSchema[key] = generateFieldObject(field, key);

    var objectSchema = schema[key].properties || schema[key].subSchema;
    var scaffoldObjectSchema = scaffoldSchema[key].subSchema;

    for (var i in objectSchema) {
      if (!objectSchema.hasOwnProperty(i)) continue;
      
      var objectField = objectSchema[i];

      setRequiredValidators(objectField.required, objectField.properties);
      setUpSchemaFields(objectField, i, objectSchema, scaffoldObjectSchema);
    }
  }

  /**
   * The following attributes won't be rendered in the front-end forms
   * @HACK @TODO this should be filtered with some useful logic
   */
  var ATTRIBUTE_BLACKLIST = [
    '_colorLabel',
    '_component',
    '_componentType',
    '_courseId',
    '_enabledPlugins',
    '_hasPreview',
    '_id',
    '_isSelected',
    '_latestTrackingId',
    '_layout',
    '_menu',
    '_parentId',
    '_supportedLayout',
    '_theme',
    '_themePreset',
    '_trackingId',
    '_type',
    'createdAt',
    'createdBy',
    'menuSettings',
    'themeSettings',
    'themeVariables',
    'updatedAt',
    'userGroups',
  ];
  function buildSchema(requiredKeys, properties) {
    var scaffoldSchema = {};

    const blacklist = [...ATTRIBUTE_BLACKLIST];

    Object.entries(properties).forEach(([k,v]) => {
      try {
        if(v._backboneForms.showInUi === false && !blacklist.includes(k)) {
          blacklist.push(k)
        }
      } catch(e) {}
    });
    properties = _.omit(properties, blacklist);
    trimEmptyProperties(properties);
    setRequiredValidators(_.without(requiredKeys, ...blacklist), properties);
    properties = { type: 'object', properties };
    setUpSchemaFields(properties, 'properties', { properties }, scaffoldSchema);

    return scaffoldSchema.properties.subSchema;
  }

  function trimEmptyProperties(object) {
    for (var key in object) {
      if (!object.hasOwnProperty(key) || object[key].type !== 'object') continue;
      if (_.isEmpty(object[key].properties)) delete object[key];
    }
  }

  function buildFieldsets(schema, options) {
    var fieldsets = {
      general: { key: 'general', legend: Origin.l10n.t('app.scaffold.general'), fields: [] },
      properties: { key: 'properties', legend: Origin.l10n.t('app.scaffold.properties'), fields: [] },
      settings: { key: 'settings', legend: Origin.l10n.t('app.scaffold.settings'), fields: [] },
      _extensions: { key: 'extensions', legend: Origin.l10n.t('app.scaffold.extensions'), fields: [ '_extensions' ] }
    };

    for (var key in schema) {
      if (!schema.hasOwnProperty(key) || key === '_extensions') continue;

      var value = schema[key];
      var adaptConfig = value._adapt;

      if (adaptConfig && adaptConfig.isSetting) {
        fieldsets.settings.fields.push(key);
        continue;
      }
      if (value.type !== 'object') {
        fieldsets.general.fields.push(key);
        continue;
      }
      if (fieldsets[key]) {
        fieldsets[key].fields.push(key);
        continue;
      }
      fieldsets[key] = {
        key: key,
        legend: value.title,
        fields: [key]
      };
    }
    // remove any empty fieldsets
    Object.keys(fieldsets).forEach(k => {
      const fields = fieldsets[k].fields;
      if(!fields) {
        return;
      }
      /*
      * Delete any 'empty' fieldsets:
      * - No fields specified 
      * - Only an empty object with no sub-props exists on the schema, so there's nothing to render
      * */
     const noFieldsOnSchema = fields.some(f => {
      return !schema[f] || (schema[f].type === 'object' && schema[f].properties === undefined);
     });
      if(!fields.length || noFieldsOnSchema) delete fieldsets[k];
    });
    return _.values(fieldsets);
  }

  function setRequiredValidators(requiredKeys, schema) {
    if (!requiredKeys) return;

    requiredKeys.forEach(function(requiredKey) {
      var field = schema[requiredKey];
      var config = field._backboneForms || {};

      if (typeof config === 'string') {
        field._backboneForms = { type: config, validators: [ 'required' ] };
        return;
      }
      (config.validators = config.validators || []).push('required');
      field._backboneForms = config;
    });
  }

  Scaffold.buildForm = async function(options) {
    var model = options.model;
    var schemaType = model.get('_type') || model._type || model.get('type') || model.type || options.schemaType;

    if(schemaType === 'menu' || schemaType === 'page') {
      schemaType = 'contentobject';
    } else if(schemaType === 'component') {
      try {
        const plugin = Origin.editor.data.componentTypes.findWhere({ name: model.get('_component') });
        schemaType = `${plugin.get('targetAttribute').slice(1)}-${schemaType}`;
      } catch(e) {} // nothing to do
    }
    let schema;
    try {
      const query = model.get('_courseId') ? `&courseId=${model.get('_courseId')}` : '';
      schema = await $.getJSON(`api/content/schema?type=${schemaType}${query}`);
    } catch(e) {
      console.error(e);
    }
    options.model.schema = buildSchema(schema.required, schema.properties);
    options.fieldsets = buildFieldsets(schema.properties, options);
    alternativeModel = options.alternativeModelToSave;
    alternativeAttribute = options.alternativeAttributeToSave;
    currentModel = options.model;
    currentForm = new Backbone.Form(options).render();

    return currentForm;
  };

  Scaffold.addCustomField = function(fieldName, view, overwrite) {
    if (Backbone.Form.editors[fieldName] && !overwrite) {
      console.log('Sorry, the custom field you’re trying to add already exists');
    } else {
      Backbone.Form.editors[fieldName] = view;
    }
  };

  Scaffold.addCustomTemplate = function(templateName, template, overwrite) {
    if (!templateName || !template) {
      return console.log('Custom templates need a name and template');
    }
    if (customTemplates[templateName] && !overwrite) {
      console.log('Sorry, the custom template you’re trying to add already exists');
    } else {
      customTemplates[templateName] = template;
    }
  };

  Scaffold.addCustomValidator = function(name, validatorMethod) {
    if (!name || !validatorMethod) {
      console.log('Custom validators need a name and validatorMethod');
    } else {
      customValidators.push({ name: name, validatorMethod: validatorMethod });
    }
  };
  // example of customValidator
  /*
  Scaffold.addCustomValidator('title', function(value, formValues) {
    var err = {
      type: 'username',
      message: 'Usernames must be at least three characters long'
    };

    if (value.length < 3) return err;
  });
  */
  Scaffold.getCurrentModel = () => currentModel;
  Scaffold.getCurrentForm = () => currentForm;
  Scaffold.getAlternativeModel = () => alternativeModel;
  Scaffold.getAlternativeAttribute = () => alternativeAttribute;
  Scaffold.getCurrentActiveModals = () => ActiveItemsModal;
  Scaffold.isOverlayActive = () => isOverlayActive;
  Scaffold.setOverlayActive = value => isOverlayActive = value;
  Scaffold.addCustomField('Boolean', Backbone.Form.editors.Checkbox);
  Scaffold.addCustomField('QuestionButton', Backbone.Form.editors.Text);

  Origin.on({
    'scaffold:increaseActiveModals': () => ActiveItemsModal++,
    'scaffold:decreaseActiveModals': () => ActiveItemsModal--
  });

  Origin.scaffold = Scaffold;
});