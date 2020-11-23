// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var EditorOriginView = require('../../global/views/editorOriginView');
  var ContentPluginCollection = require('core/collections/contentPluginCollection');

  var EditorExtensionsEditView = EditorOriginView.extend({
    className: "extension-management",
    tagName: "div",
    // TODO do we need to turn this off?
    settings: {
      autoRender: false
    },
    events: {
      'click button.remove-extension': 'onRemoveExtensionClicked',
      'click button.add-extension': 'onAddExtensionClicked'
    },

    preRender: function() {
      this.currentSelectedIds = [];

      this.listenTo(Origin, {
        'editorExtensionsEdit:views:add': this.addExtension,
        'editorExtensionsEdit:views:remove': this.removeExtension
      });
      // assumption: extensions are always switched between enabled and available
      this.listenTo(this.model, 'change:enabledExtensions', this.render);
      this.setupExtensions(this.postRender.bind(this));
    },

    setupExtensions: function(callback) {
      var plugins = new ContentPluginCollection(undefined, { type: 'extension' });
      
      plugins.fetch({
        success: (function() {
          var partitioned = _.partition(plugins.models, function(e) {
            return _.indexOf(Origin.editor.data.config.get('_enabledPlugins'), e.get('name')) > -1;
          });
          this.model.set({
            enabledExtensions: partitioned[0].sort(this.sortByDisplayName),
            availableExtensions: partitioned[1].sort(this.sortByDisplayName)
          });
          if(callback) callback();

        }).bind(this),
        error: function(e) {
          if(callback) return callback(e);
        }
      })
    },

    sortByDisplayName: function(a, b) {
      if(a.get('displayName') < b.get('displayName')) return -1;
      if(a.get('displayName') > b.get('displayName')) return 1;
      return 0;
    },

    /**
    * Event handling
    */

    onAddExtensionClicked: function(event) {
      this.currentSelectedIds = [$(event.currentTarget).attr('data-id')];
      Origin.trigger('editorExtensionsEdit:views:add');
    },

    onRemoveExtensionClicked: function(event) {
      this.currentSelectedIds = [$(event.currentTarget).attr('data-id')];

      Origin.Notify.confirm({
        type: 'warning',
        title: Origin.l10n.t('app.deleteextension'),
        text: Origin.l10n.t('app.confirmdeleteextension'),
        callback: _.bind(this.onRemoveExtensionConfirmed, this)
      });
    },

    onRemoveExtensionConfirmed: function(confirmed) {
      if(confirmed) Origin.trigger('editorExtensionsEdit:views:remove');
    }
  }, {
    template: 'editorExtensionsEdit'
  });

  return EditorExtensionsEditView;
});
