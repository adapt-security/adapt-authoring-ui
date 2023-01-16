// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var OriginView = require('core/views/originView');
  var Origin = require('core/origin');

  var PluginTypeView = OriginView.extend({
    className: 'pluginType-item tb-row',
    tagName: 'div',

    events: {
      'change input.pluginType-enabled': 'toggleEnabled',
      'change input.pluginType-addedDefault': 'toggleAddedDefault',
      'click .plugin-update': 'updatePlugin',
      'click .plugin-remove': 'deletePluginPrompt'
    },

    preRender: function () {
      this.listenTo(this, 'remove', this.remove);
      this.listenTo(this.model, 'sync', this.render);
    },

    render: function () {
      var template = Handlebars.templates[this.constructor.template];
      this.$el.html(template(this.model.attributes));
      return this;
    },

    toggleEnabled: function () {
      this.model.save({ isEnabled: this.$('.pluginType-enabled').is(':checked') }, { patch: true });
    },

    toggleAddedDefault: function() {
      this.model.save({ isAddedByDefault: this.$('.pluginType-addedDefault').is(':checked') }, { patch: true });
    },

    updatePlugin: async function (event) {
      event && event.preventDefault();
      var $btn = this.$('.plugin-update');

      if($btn.is(':disabled')) return false;

      $btn.attr({ disabled: true, title: Origin.l10n.t('app.updating') });
      try {
        await $.post(`${this.model.url()}/update`);
      } catch(e) {
        Origin.Notify.alert({ type: 'error', text: e.responseJSON.message });
      }
      this.model.fetch();
      return false;
    },

    deletePluginPrompt: function(event) {
      event && event.preventDefault();
      Origin.Notify.confirm({
        type: 'warning',
        title: Origin.l10n.t('app.deleteplugin'),
        text: Origin.l10n.t('app.confirmdeleteplugin', { plugin: this.model.get('displayName') }),
        destructive: false,
        callback: result => {
          if(!result.isConfirmed) return;
          this.model.destroy({ 
            success: () => this.remove(),
            error: (model, jqXhr) => Origin.Notify.alert({ type: 'error', text: jqXhr.responseJSON.message })
          });
        }
      });
    }
  }, {
    template: 'pluginType'
  });

  return PluginTypeView;
});
