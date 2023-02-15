// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var _ = require('underscore');
  var Helpers = require('core/helpers');
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');

  var PluginManagementUploadView = OriginView.extend({
    className: 'pluginManagement-upload-plugin',

    preRender: function() {
      Origin.contentHeader.setTitle({ title: Origin.l10n.t('app.uploadplugin') });
      this.listenTo(Origin, 'actions:save', this.uploadFile);
      Origin.on('actions:cancel', () => Origin.router.navigateBack());
    },

    postRender: function() {
      _.defer(this.setViewToReady);
    },

    uploadFile: async function() {
      if(this.validate()) {
        $('.loading').show();
        try {
          const form = this.$('.plugin-form');
          await Helpers.submitForm(form);
        } catch(e) {
          Origin.Notify.toast({ type: 'error', title: Origin.l10n.t('app.uploadpluginerror'), text: e.responseJSON && e.responseJSON.message });
          Origin.router.navigateTo('pluginManagement/upload');
        }
        Origin.Notify.toast({ type: 'success', text: Origin.l10n.t('app.uploadpluginsuccess') });
        Origin.router.navigateTo('pluginManagement');
        $('.loading').hide();
      }
    },

    validate: function() {
      if(_.isEmpty(this.$('form input').val())) {
        this.$('.field-error').removeClass('display-none');
        return false;
      }
      this.$('.field-error').addClass('display-none');
      return true;
    }
  }, {
    template: 'pluginManagementUpload'
  });

  return PluginManagementUploadView;
});
