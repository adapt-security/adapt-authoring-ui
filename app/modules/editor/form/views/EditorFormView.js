// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');
  var Helpers = require('../global/helpers');

  var EditorFormView = EditorOriginView.extend({
    className: "ceditor-form",
    tagName: "div",

    initialize: function(options) {
      if (options.model) {
        Origin.scaffold.buildForm({ model: options.model })
          .then(form => {
            this.form = form;
            this.filters = [];
            this.listenTo(Origin, {
              'actions:save': this.save,
              'actions:cancel': this.cancel,
              'editorSidebarView:removeEditView': this.remove
            });
            Helpers.setPageTitle(options.model);
            Origin.trigger('sidebar:sidebarContainer:hide');
            Origin.contentHeader.setButtons(Origin.contentHeader.BUTTON_TYPES.ACTIONS, Origin.contentHeader.ACTION_BUTTON_TEMPLATES.EDIT_FORM);
            OriginView.prototype.initialize.apply(this, arguments);
          })
          .catch(e => Origin.Notify.alert({ type: 'error', text: e.message }));
      }
    },

    render: function() {
      OriginView.prototype.render.apply(this, arguments);
      if(this.model) this.$el.attr('data-id', this.model.get('_id'));
      return this;
    },

    postRender: function() {
      if (!this.form) {
        return this.setViewToReady();
      }
      this.$('.form-container').append(this.form.el);
    },

    filterForm: function(filter) {
      if(this.filters.includes(filter)) { // toggle filter
        this.filters = _.reject(this.filters, filterItem => filterItem === filter);
      } else {
        this.filters.push(filter);
      }
      if(this.filters.length) { // Now actually filter the form
        $('.form-container > form > div > fieldset').addClass('display-none');
        this.filters.forEach(f => $(`fieldset[data-key=${f}]`).removeClass('display-none'));
      } else {
        $('.form-container > form > div > fieldset').removeClass('display-none');
      }
    },

    save: function() {
      if(!this.form) {
        return;
      }
      var errors = this.form.validate();
      // MUST trigger as sidebar needs to know when the form has been resubmitted
      Origin.trigger('editorSidebar:showErrors', errors);

      if(errors) {
        var errorText = `${Origin.l10n.t('app.validationfailedmessage')}<br/><br/>${this.buildErrorMessage(errors)}`;
        // TODO remove when we've got a better solution
        this.onSaveError(Origin.l10n.t('app.validationfailed'), errorText);
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

    buildErrorMessage: function(errorObjs, message = "") {
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
      Origin.trigger('sidebar:resetButtons');
    }
  }, {
    template: 'editorForm'
  });

  return EditorFormView;
});