define([ 'core/origin', 'backbone-forms' ], function(Origin, BackboneForms) {

  var ScaffoldCodeEditorView =  Backbone.Form.editors.Base.extend({
    defaultValue: '',
    className: 'scaffold-code-editor',
    editor: null,
    mode: 'text',
    session: null,

    initialize: function(options) {
      Backbone.Form.editors.Base.prototype.initialize.call(this, options);

      var inputType = options.schema.inputType;
      var mode = inputType.mode || inputType.split(':')[1];

      if(mode) this.mode = mode;
    },

    render: function() {
      this.editor = window.ace.edit(this.$el[0], {
        maxLines: 50,
        minLines: 14,
        mode: `ace/mode/${this.mode}`,
      });
      this.editor.on('change', () => this.trigger('change', this));
      this.setValue(this.value);

      return this;
    },

    setValue: function(value) {
      this.editor.setValue(this.mode === 'json' ? JSON.stringify(value, null, '\t') : value);
    },

    getValue: function() {
      var value = this.editor.getValue();

      if(this.mode !== 'json') return value;

      try {
        return JSON.parse(value);
      } catch(e) {
        return value;
      }
    },

    validate: function() {
      var error = Backbone.Form.editors.Base.prototype.validate.call(this);
      if(error) return error;
      if(this.isSyntaxError()) return { message: Origin.l10n.t('app.errorsyntax') };
    },

    isSyntaxError: function() {
      return this.editor.getSession().getAnnotations().every(a => a.type !== 'error');
    }
  });

  Origin.on('origin:dataReady', function() {
    Origin.scaffold.addCustomField('CodeEditor', ScaffoldCodeEditorView);
    Origin.scaffold.addCustomField('CodeEditor:javascript', ScaffoldCodeEditorView);
    Origin.scaffold.addCustomField('CodeEditor:less', ScaffoldCodeEditorView);
  });

  return ScaffoldCodeEditorView;
});
