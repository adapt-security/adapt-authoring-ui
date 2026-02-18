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
      this.listenTo(this.model, {
        sync: this.render,
        destroy: this.remove
      });
    },

    render: function () {
      var template = Handlebars.templates[this.constructor.template];
      this.$el.html(template(this.model.attributes));
      return this;
    },

    toggleEnabled: function () {
      this.model.save({ 
        isEnabled: this.$('.pluginType-enabled').is(':checked') 
      }, { patch: true });
    },

    toggleAddedDefault: function() {
      this.model.save({
        isAddedByDefault: this.$('.pluginType-addedDefault').is(':checked')
      }, { patch: true });
    },

    updatePlugin: function (event) {
      event && event.preventDefault();
      var $btn = this.$('.plugin-update');
      var $icon = $btn.find('i');

      if($btn.is(':disabled')) return false;

      $btn.attr({
        disabled: true,
        title: Origin.l10n.t('app.updating')
      });
      $icon.removeClass().addClass('fa fa-refresh fa-spin');

      $.post(`${this.model.url()}/update`)
        .done(function() {
          this.model.set({ canBeUpdated: false });
          this.render();
        }.bind(this))
        .fail(function(e) {
          $btn.attr('title', Origin.l10n.t('app.updatefailed'));
          $icon.removeClass().addClass('fa fa-times');
          Origin.Notify.alert({ type: 'error', text: e.responseJSON.message });
        });

      return false;
    },

    deletePluginPrompt: async function(event) {
      event && event.preventDefault();

      const useData = await $.get(`${this.model.url()}/uses`);

      if (useData.length === 0) {
        Origin.Notify.confirm({
          type: 'warning',
          title: Origin.l10n.t('app.deleteplugin'),
          text: Origin.l10n.t('app.confirmdeleteplugin', { plugin: this.model.get('displayName') }),
          destructive: false,
          callback: this.deletePluginConfirm.bind(this)
        });
        return;
      }
      Origin.Notify.alert({
        type: 'error',
        title: `${Origin.l10n.t('app.cannotdelete')} ${this.model.get('displayName')}`,
        text: useData.reduce((s, d) => {
          return `${s}${d.title} ${Origin.l10n.t('app.by')} ${d.createdBy}<br />`;
        }, `${Origin.l10n.t('app.coursesused')}<br />`)
      });
    },

    deletePluginConfirm: function(result) {
      if (result.isConfirmed) {
        this.model.destroy().done(this.remove.bind(this));
      }
    }
  }, {
    template: 'pluginType'
  });

  return PluginTypeView;
});
