// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');
  var Helpers = require('../../global/helpers');

  var EditorFormView = OriginView.extend({
    className: "ceditor-form",
    tagName: "div",

    initialize: function(options) {
      Origin.scaffold.buildForm({ model: options.model })
        .then(form => {
          this.form = form;
          this.filters = [];
          this.listenTo(Origin, {
            'actions:save': this.save,
            'actions:cancel': Origin.router.navigateBack,
          });
          Helpers.setPageTitle(options.model);
          Origin.contentHeader.setButtons(Origin.contentHeader.BUTTON_TYPES.ACTIONS, Origin.contentHeader.ACTION_BUTTON_TEMPLATES.EDIT_FORM);

          OriginView.prototype.initialize.apply(this, arguments);
        })
        .catch(e => Origin.Notify.alert({ type: 'error', text: e.message }));
    },

    render: function() {
      OriginView.prototype.render.apply(this, arguments);
      if(this.model) this.$el.attr('data-id', this.model.get('_id'));
      return this;
    },

    postRender: function() {
      this.setUpFilters();
      this.$('.form-container').append(this.form.el);
    },

    setUpFilters() {
      const filters = [
        {
          name: Origin.l10n.t('app.search'),
          items: [{
            type: 'search',
            eventName: 'search'
          }]
        },
        {
          items: [{
            type: 'toggle',
            buttonText: 'Hide non-text settings',
            eventName: 'hidenontext'
          }]
        }
      ];
      const fieldsetFilters = [];
      $('fieldset', this.form.el).each((i, fieldset) => {
        const $f = $(fieldset);
        const key = $f.attr('data-key');
        if(!key) {
          return;
        }
        fieldsetFilters.push({
          type: 'toggle',
          buttonText: $('legend', $f).text(),
          checked: true,
          eventName: 'fieldset'
        });
      });
      
      if(fieldsetFilters.length) {
        filters.push({
          id: 'fieldsets',
          name: 'Fieldsets',
          items: fieldsetFilters
        });
        Origin.on('filters:fieldset', this.filterFieldsets);
      }
      Origin.on('filters:hidenontext', this.filterNonText);

      Origin.contentHeader.setButtons(Origin.contentHeader.BUTTON_TYPES.FILTERS, filters);
    },

    
    filterByTitle: function(filter) {
      console.log('filterByTitle:', filter);
    },
    
    filterNonText: function(filter) {
      console.log('filterNonText:', filter);
    },
    
    filterFieldsets: function(filter) {
      console.log('filterFieldsets:', filter);
    },

    save: function() {
      var errors = this.form.validate();
      if(errors) {
        this.onSaveError(Origin.l10n.t('app.validationfailed'), this.buildErrorMessage(errors));
        return;
      }
      this.form.commit();
      this.model.pruneAttributes();

      var attrs = this.getAttributesToSave();
      if(attrs) attrs._type = this.model.get('_type');

      this.model.save(attrs, {
        patch: !!attrs,
        success: this.onSaveSuccess.bind(this),
        error: (model, jqXhr) => this.onSaveError(undefined, jqXhr.responseJSON && jqXhr.responseJSON.message)
      });
    },

    buildErrorMessage: function(errorObjs, message = `${Origin.l10n.t('app.validationfailedmessage')}<br/><br/>`) {
      _.each(errorObjs, function(item, key) {
        if(item.hasOwnProperty('message')) {
          message += `<span class="key">${item.title || key}</span>: ${item.message}<br/>`;
        } else if(_.isObject(item)) { // recurse
          message = this.buildErrorMessage(item, message);
        }
      }, this);
      return message;
    },

    getAttributesToSave: function() {
      var changed = this.model.changedAttributes();
      if(changed) return Object.assign(changed, { _id: this.model.get('_id'), _courseId: this.model.get('_courseId') });
    },

    onSaveSuccess: function() {
      Origin.trigger('editor:refreshData', () => {
        Origin.router.navigateBack();
        this.remove();
      });
    },

    onSaveError: function(pTitle, pText) {
      Origin.Notify.alert({ 
        type: 'error', 
        title: _.isString(pTitle) ? pTitle : Origin.l10n.t('app.errordefaulttitle'), 
        text: _.isString(pText) ? pText : Origin.l10n.t('app.errorsave')
      });
    }
  }, {
    template: 'editorForm'
  });

  return EditorFormView;
});