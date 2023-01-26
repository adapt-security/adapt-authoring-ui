// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var ApiCollection = require('core/collections/apiCollection');
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');
  var PluginTypeView = require('./pluginTypeView');

  var PluginManagementView = OriginView.extend({
    className: "pluginManagement",
    tagName: "div",
    pluginType: "plugin",

    events: {
      'click .refresh-all-plugins': 'fetch'
    },

    initialize: function(options) {
      this.contentPlugins = ApiCollection.ContentPlugins();
      this.contentPlugins.on('sync', this.renderPlugins, this);
      this.currentFilters = {};

      Origin.on({
        'actions:upload': () => Origin.router.navigateTo('pluginManagement/upload'),
        'filters': this.filter,
        'links': window.open
      }, this);

      this.fetch();

      return OriginView.prototype.initialize.apply(this, arguments);
    },

    renderStatusMessage: function(message) {
      this.$('.pluginManagement-plugins').append(`<div class="pluginManagement-status">${Origin.l10n.t(message)}</div>`);
    },

    renderPlugins: function() {
      this.$('.pluginManagement-plugins').empty();
  
      this.contentPlugins.forEach(c => {
        if(this.currentFilters.updateAvailable && !c.get('canBeUpdated')) {
          return;
        }
        this.$('.pluginManagement-plugins').append(new PluginTypeView({ model: c }).$el);
      });
      if(!$('.pluginType-item ').length) this.renderStatusMessage('app.noplugintypes');

      this.setViewToReady();
    },

    fetch: async function() {
      try {
        this.contentPlugins.customQuery.includeUpdateInfo = true;
        await this.contentPlugins.fetch({ reset: true });
      } catch(e) {
        Origin.Notify.toast({ type: 'error', text: e.responseJSON.message });
      }
    },

    filter: function(filters) {
      this.currentFilters = filters;
      const filterQuery = {
        isEnabled: filters.isEnabled
      };
      if(filters.search) {
        const q = {  $regex: `.*${filters.search.toLowerCase()}.*`, $options: 'i' };
        filterQuery.$or = [{ title: q }, { description: q }];
      }
      if(filters.type) {
        filterQuery.type = { $in: Object.entries(filters.type).filter(([k,v]) => v).map(([k]) => k) };
      }
      this.contentPlugins.customQuery = filterQuery;
      this.fetch();
    }
  }, {
    template: 'pluginManagement'
  });

  return PluginManagementView;
});
