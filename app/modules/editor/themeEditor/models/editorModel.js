// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
    var Backbone = require('backbone');
    var Origin = require('core/origin');

    var EditorModel = Backbone.Model.extend({
      idAttribute: '_id',
      whitelistAttributes: null,
      _type: 'theme',

      initialize : function() {
        this.on('sync change', this.loadedData, this);
        this.fetch();
      },

      loadedData: function() {
        if(this._siblings) this._type = this._siblings;
        Origin.trigger('editorModel:dataLoaded', this._type);
      },

      getParent: function() {
        if(this.get('_type') !== 'course') {
          return Origin.editor.data.content.findWhere({ _id: this.get('_parentId') });
        }
      },

      getSiblings: function(shouldIncludeSelf) {
        var siblings = Origin.editor.data.content.where({ _parentId: this.get('_parentId') });
        if (!shouldIncludeSelf) siblings.remove(this.get('id'));
        return new Backbone.Collection(siblings);
      },

      getChildren: function() {
        return new Backbone.Collection(Origin.editor.data.content.where({ _parentId: this.get("_id") }));
      },

      setOnChildren: function(key, value, options) {           
        if(this._children) {
          this.getChildren().each(function(child) { child.setOnChildren.apply(child, arguments); });
        }
      },
      /**
       * Remove any attributes which are not on the whitelist (useful to call before a save)
       */
      pruneAttributes: function() {
        if(this.whitelistAttributes) { 
          Object.keys(this.attributes).forEach(function(key) {
            if (!_.contains(this.whitelistAttributes, key)) this.unset(key);
          }, this);
        }
      },

      serialize: function() {
        return JSON.stringify(this);
      },

      serializeChildren: function() {
        return this.getChildren().reduce(function(s,c) { return s + c.serialize(); }, '');  
      }
    });

    return EditorModel;

});
