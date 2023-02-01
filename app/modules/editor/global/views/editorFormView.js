// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');
  var Helpers = require('../../global/helpers');

  var EditorFormView = OriginView.extend({
    className: "editor-form",
    tagName: "div",

    initialize: async function(options) {
      let form;
      try {
        form = await Origin.scaffold.buildForm({ model: options.model });
      } catch(e) {
        Origin.Notify.alert({ type: 'error', text: e.message });
      }
      this.form = form;
      this.filters = [];
      this.listenTo(Origin, {
        'actions:save': this.save,
        'actions:cancel': Origin.router.navigateBack,
        'filters': this.filter
      });
      Helpers.setPageTitle(options.model);
      Origin.contentHeader.setButtons(Origin.contentHeader.BUTTON_TYPES.ACTIONS, Origin.contentHeader.ACTION_BUTTON_TEMPLATES.EDIT_FORM);
      
      OriginView.prototype.initialize.apply(this, arguments);
    },

    render: function() {
      OriginView.prototype.render.apply(this, arguments);
      if(this.model) this.$el.attr('data-id', this.model.get('_id'));
      return this;
    },

    postRender: function() {
      Origin.contentHeader.setButtons(Origin.contentHeader.BUTTON_TYPES.ACTIONS, Origin.contentHeader.ACTION_BUTTON_TEMPLATES.EDIT_FORM);
      this.setUpFilters();
      this.$('.form-container').append(this.form.el);
    },

    setUpFilters() {
      const filters = [
        {
          name: Origin.l10n.t('app.search'),
          items: [{
            id: 'search',
            type: 'search',
            itemClass: 'no-padding'
          }]
        },
        {
          items: [{
            id: 'translatable',
            type: 'toggle',
            buttonText: Origin.l10n.t('app.hidenontext')
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
          id: key,
          type: 'toggle',
          buttonText: $('legend', $f).text(),
          checked: true
        });
      });
      
      if(fieldsetFilters.length) {
        filters.push({
          id: 'fieldsets',
          name: 'Fieldsets',
          items: fieldsetFilters
        });
      }
      Origin.contentHeader.setButtons(Origin.contentHeader.BUTTON_TYPES.FILTERS, filters);
    },

    
    filter: function(filters) {
      const hiddenClass = 'display-none';
      // hide individual fields
      $('.field').each((i, field) => {
        $f = $(field);
        let hidden = filters.translatable && !$f.hasClass('is-translatable');
        if(filters.search) {
          $('legend, label', $f).each((i, item) => {
            if(!hidden && !$(item).text().toLowerCase().includes(filters.search.toLowerCase())) {
              hidden = true;
            }
          });
        }
        $f.toggleClass(hiddenClass, hidden);
        if(!hidden) $f.parents('.field').removeClass(hiddenClass);
      });
      // hide hidden/empty fieldsets
      $(`fieldset`).each((i, fieldset) => {
        const $f = $(fieldset);
        const hidden = filters.fieldsets[$f.attr('data-key')] === false || $('.field', $f).not(`.${hiddenClass}`).length === 0;
        $f.toggleClass(hiddenClass, hidden);
      });
      // show message when no results
      $('.editor-form .no-matches').toggleClass(hiddenClass, $('fieldset').not('.fieldset-object').not(`.${hiddenClass}`).length > 0);
    },
    
    save: async function() {
      var errors = this.form.validate();
      if(errors) {
        return Origin.Notify.toast({ 
          type: 'error', 
          title: Origin.l10n.t('app.validationfailed'),
          text: this.buildErrorMessage(errors)
        });
      }
      this.form.commit();
      this.model.pruneAttributes();

      var attrs = this.getAttributesToSave();
      if(attrs) attrs._type = this.model.get('_type');
      try {
        await this.model.save(attrs, { patch: !!attrs, silent: false });
      } catch(e) {
        return Origin.Notify.toast({ type: 'error', title: Origin.l10n.t('app.errorsavetitle'), text: e.message });
      }
      Origin.router.navigateBack();
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
    }
  }, {
    template: 'editorForm'
  });

  return EditorFormView;
});
