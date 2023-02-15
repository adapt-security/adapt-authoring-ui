// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var _ = require('underscore');
  var Helpers = require('core/helpers');
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');

  var PluginManagementUploadView = OriginView.extend({
    className: 'pluginManagement-upload-plugin',

    preRender: function() {
      Origin.trigger('contentHeader:updateTitle', { title: Origin.l10n.t('app.uploadplugin') });
      this.listenTo(Origin, 'pluginManagement:uploadPlugin', this.uploadFile);
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
          Origin.Notify.alert({ type: 'success', text: Origin.l10n.t('app.uploadpluginsuccess') });
          Origin.router.navigateTo('pluginManagement');
        } catch(e) {
          Origin.Notify.alert({ type: 'error', title: Origin.l10n.t('app.uploadpluginerror'), text: e.responseJSON && e.responseJSON.message });
          Origin.router.navigateTo('pluginManagement/upload');
        } finally {
          $('.loading').hide();
          Origin.trigger('sidebar:resetButtons');
        }
      }
    },

    validate: function() {
      if(_.isEmpty(this.$('form input').val())) {
        this.$('.field-error').removeClass('display-none');
        Origin.trigger('sidebar:resetButtons');
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