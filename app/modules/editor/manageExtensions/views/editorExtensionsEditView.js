// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var ApiCollection = require('core/collections/apiCollection');
  var Origin = require('core/origin');
  var EditorOriginView = require('../../global/views/editorOriginView');

  var EditorExtensionsEditView = EditorOriginView.extend({
    className: "extension-management",
    tagName: "div",
    events: {
      'click button.remove-extension': 'onRemoveExtensionClicked',
      'click button.add-extension': 'onAddExtensionClicked'
    },

    preRender: function() {
      this.ajaxOptions = {
        url: `api/content/${Origin.editor.data.config.get('_id')}`, 
        method: 'PATCH',
        success: () => Origin.editor.data.config.fetch({ success: () => this.setupExtensions() }), 
        error: jqXhr => Origin.Notify.toast({ type: 'error', text: jqXhr.status })
      };
      this.listenTo(this.model, 'change:enabledExtensions', this.render);
      this.setupExtensions(() => this.setViewToReady());
    },

    setupExtensions: function(callback) {
      var plugins = ApiCollection.ContentPlugins({ customQuery: { type: 'extension' } });
      plugins.fetch({
        success: () => {
          const enabledPlugins = Origin.editor.data.config.get('_enabledPlugins');
          var [enabled, available] = _.partition(plugins.models, e => enabledPlugins.includes(e.get('name')));
          this.model.set({
            enabledExtensions: enabled.sort(this.sortByDisplayName),
            availableExtensions: available.filter(e => e.get('isEnabled')).sort(this.sortByDisplayName)
          });
          if(callback) callback();

        },
        error: e => callback && callback(e)
      })
    },

    sortByDisplayName: function(a, b) {
      if(a.get('displayName') < b.get('displayName')) return -1;
      if(a.get('displayName') > b.get('displayName')) return 1;
      return 0;
    },

    // Event handling

    onAddExtensionClicked: function(event) {
      $.ajax(Object.assign(this.ajaxOptions, {
        data: { 
          _enabledPlugins: [
            ...Origin.editor.data.config.get('_enabledPlugins'), 
            $(event.currentTarget).attr('data-name')
          ]
        } 
      }));
    },

    onRemoveExtensionClicked: function(event) {
      Origin.Notify.confirm({
        type: 'warning',
        title: Origin.l10n.t('app.deleteextension'),
        text: Origin.l10n.t('app.confirmdeleteextension'),
        callback: result => {
          if(!result.isConfirmed) {
            return;
          }
          const toRemove = $(event.currentTarget).attr('data-name');
          $.ajax(Object.assign(this.ajaxOptions, {
            data: { 
              _enabledPlugins: Origin.editor.data.config.get('_enabledPlugins').filter(e => e !== toRemove) 
            }
          }));
        }
      });
    }
  }, {
    template: 'editorExtensionsEdit'
  });

  return EditorExtensionsEditView;
});
