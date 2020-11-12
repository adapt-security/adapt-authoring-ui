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

  function buildSchema(requiredKeys, schema, options, type) {
    var scaffoldSchema = {};
    var field = { type: 'object', properties: Object.assign({}, schema) };
    
    trimEmptyProperties(field.properties);
    
    var nestedProps = field.properties;
    var key = 'properties';

    schema = { properties: field };
    setRequiredValidators(requiredKeys, nestedProps);

    if (!options.isTheme || !nestedProps) {
      setUpSchemaFields(field, key, schema, scaffoldSchema);
      return scaffoldSchema.properties.subSchema;
    }
    // process nested properties on edit theme page
    for (var innerKey in nestedProps) {
      if (!nestedProps.hasOwnProperty(innerKey)) continue;
      setUpSchemaFields(nestedProps[innerKey], innerKey, nestedProps, scaffoldSchema);
    }
    return scaffoldSchema;
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
      extensions: { key: 'extensions', legend: Origin.l10n.t('app.scaffold.extensions'), fields: [ '_extensions' ] }
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
      var nestedProps = value.properties;
      var fields = [];
      // process nested properties on edit theme page
      if (options.isTheme) {
        for (var innerKey in nestedProps) {
          if (nestedProps.hasOwnProperty(innerKey)) {
            fields.push(innerKey);
          }
        }
      }
      fieldsets[key] = {
        key: key,
        legend: value.title,
        fields: fields.length ? fields : [ key ]
      };
    }
    if (!schema._extensions) {
      delete fieldsets.extensions;
    }
    if (!fieldsets.settings.fields.length) {
      delete fieldsets.settings;
    }
    if (!fieldsets.properties.fields.length) {
      delete fieldsets.properties;
    }
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
    var schemaType = contentType = model.get('_type') || model._type || options.schemaType;
    options.isTheme = false;

    switch (schemaType) {
      case 'menu':
      case 'page':
        schemaType = contentType = 'contentobject';
        break;
      case 'component':
        contentType = model.get('_component');
        break;
      case 'theme':
        contentType = options.schemaType;
        options.isTheme = true;
    }
    let schema;
    try {
      const query = model.get('_courseId') ? `&courseId=${model.get('_courseId')}` : '';
      schema = await $.getJSON(`api/content/schema?type=${schemaType}${query}`);
    } catch(e) {
      console.error(e);
    }
    options.model.schema = buildSchema(schema.required, schema.properties, options, contentType);
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
  Scaffold.getCurrentModel = function() { return currentModel; };
  Scaffold.getCurrentForm = function() { return currentForm; };
  Scaffold.getAlternativeModel = function() { return alternativeModel; };
  Scaffold.getAlternativeAttribute = function() { return alternativeAttribute; };
  Scaffold.getCurrentActiveModals = function() { return ActiveItemsModal; };
  Scaffold.isOverlayActive = function() { return isOverlayActive; };
  Scaffold.setOverlayActive = function(booleanValue) { isOverlayActive = booleanValue; };
  Scaffold.addCustomField('Boolean', Backbone.Form.editors.Checkbox);
  Scaffold.addCustomField('QuestionButton', Backbone.Form.editors.Text);

  Origin.on({
    'scaffold:increaseActiveModals': function() { ActiveItemsModal++; },
    'scaffold:decreaseActiveModals': function() { ActiveItemsModal--; },
  });

  Origin.scaffold = Scaffold;
});