// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var ContentPluginCollection = require('core/collections/contentPluginCollection');
  var Helpers = require('core/helpers');
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');
  var PluginTypeView = require('./pluginTypeView');

  var PluginManagementView = OriginView.extend({
    className: "pluginManagement",
    tagName: "div",
    pluginType: "plugin",

    events: {
      'click .refresh-all-plugins': 'refreshPluginList'
    },

    initialize: async function(options) {
      this.currentPluginType = options.pluginType;

      this.contentPlugins = new ContentPluginCollection(undefined, { filter: { includeUpdateInfo: true } }); // all plugins
      this.pluginCollections = {}; // sorted plugins go here

      await this.refreshPluginList();
      
      return OriginView.prototype.initialize.apply(this, arguments);
    },

    preRender: function() {
      const titles = {
        component: Origin.l10n.t('app.components'),
        extension: Origin.l10n.t('app.extensions'),
        menu: Origin.l10n.t('app.menus'),
        theme: Origin.l10n.t('app.themes')
      };
      Origin.trigger('contentHeader:updateTitle', { 
        breadcrumbs: [{ title: Origin.l10n.t('app.pluginmanagement') }],
        title: titles[this.currentPluginType] 
      });
      this.refreshPluginList();
    },
    
    render: function() {
      this.model = {
        toJSON: _.bind(function() { return { type: this.currentPluginType }; }, this)
      };
      return OriginView.prototype.render.apply(this, arguments);
    },

    renderPluginTypeViews: function() {
      this.$('.pluginManagement-plugins').empty();

      var coll = this.pluginCollections[this.currentPluginType];
      if(!coll.length) {
        this.$('.pluginManagement-plugins').append(Origin.l10n.t('app.noplugintypes'));
      } else {
        coll.forEach(this.renderPluginTypeView);
      }
      this.setViewToReady();
    },

    renderPluginTypeView: function(pluginType, index) {
      var cssClass = `tb-row-${Helpers.odd(index)}`;
      var view = new PluginTypeView({ model: pluginType });
      this.$('.pluginManagement-plugins').append(view.$el.addClass(cssClass));
    },

    refreshPluginList: async function(e) {
      if(e) { // triggered by the UI, so handle button style
        e.preventDefault();
        var $btn = $(e.currentTarget);
        if($btn.is(':disabled')) return false;
        $btn.attr('disabled', true);
      }
      try {
        // sort the plugins by name and group by type
        await this.contentPlugins.fetch();
        this.pluginCollections = this.contentPlugins
          .slice()
          .sort((a,b) => a.get('name').localeCompare(b.get('name')))
          .reduce((memo,p) => {
            var type = p.get('type');
            if(!memo[type]) memo[type] = [];
            memo[type].push(p);
            return memo;
          }, {});
        // reset the button
        if(e) $(e.currentTarget).attr('disabled', false);
        this.renderPluginTypeViews();
      } catch(e) {
        console.error(e);
      }
      this.checkForFrameworkUpdate();
    },

    remove: function() {
      Origin.Notify.snackbar.close()
      OriginView.prototype.remove.apply(this, arguments);
    },

    checkForFrameworkUpdate: async function() {
      const enableUpdateApi = Origin.constants['adapt-authoring-adaptframework.enableUpdateApi'];
      const hasPermission = Origin.sessionModel.hasScopes(['update:adapt']);
      if(!enableUpdateApi || !hasPermission) {
        return
      }
      const {
        canBeUpdated,
        latestCompatibleVersion
      } = await $.get('/api/adapt/update');
      if(!canBeUpdated) {
        return;
      }
      Origin.Notify.snackbar({ 
        type: 'info',
        text: Origin.l10n.t('app.frameworkupdateavailable', { version: latestCompatibleVersion }),
        buttonText: 'Click to update',
        callback: () => {
          $.post('/api/adapt/update')
            .done(data => Origin.Notify.alert({ type: 'success', text: Origin.l10n.t('app.frameworkupdatesuccess', data) }))
            .fail(e => Origin.Notify.alert({ type: 'success', text: e.responseJSON.message }));
        } 
       });
    }
  }, {
    template: 'pluginManagement'
  });

  return PluginManagementView;
});
