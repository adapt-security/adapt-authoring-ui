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

    initialize: function(options) {
      this.currentPluginType = options.pluginType;

      this.contentPlugins = new ContentPluginCollection(); // all plugins
      this.pluginCollections = {}; // sorted plugins go here

      this.refreshPluginList();
      
      return OriginView.prototype.initialize.apply(this, arguments);
    },

    preRender: function() {
      Origin.trigger('location:title:update', { title: Origin.l10n.t('app.' + this.currentPluginType + 'management') });
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

    refreshPluginList: function(e) {
      if(e) { // triggered by the UI, so handle button style
        e.preventDefault();
        var $btn = $(e.currentTarget);
        if($btn.is(':disabled')) return false;
        $btn.attr('disabled', true);
      }
      /**
       * @NOTE this should probably be done as 4 separate requests, 
       * but this'll do until this page is refactored
       */
      this.contentPlugins.fetch({ 
        success: _.bind(function(plugins) {
          // sort the plugins by type
          this.pluginCollections = plugins.reduce(function(memo, p) {
            var type = p.get('type');
            if(!memo[type]) memo[type] = [];
            memo[type].push(p);
            return memo;
          }, {});
          // make sure each list is sorted by name
          Object.keys(this.pluginCollections).forEach(function(k) { 
            this.pluginCollections[k].sort(function(a, b) { return a.get('name').localeCompare(b.get('name')); }); 
          }, this);
          this.renderPluginTypeViews();
        }, this), 
        error: console.error 
      });
    }
  }, {
    template: 'pluginManagement'
  });

  return PluginManagementView;
});
