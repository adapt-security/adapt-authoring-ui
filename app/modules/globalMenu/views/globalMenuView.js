// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
    var Origin = require('core/origin');
    var GlobalMenuItemView = require('./globalMenuItemView');

    var GlobalMenuView = Backbone.View.extend({
        className: 'global-menu',

        initialize: function() {
            this.listenTo(Origin, 'globalMenu:globalMenuView:remove', this.removeMenu);
            this.render();
        },

        render: function() {
            var template = Handlebars.templates[this.constructor.template];
            this.$el.html(template());
            _.defer(() => this.postRender());
            return this;
        },

        postRender: function() {
            this.collection.each(this.renderItem, this);
            _.defer(() => this.$el.fadeIn(300));
        },

        renderItem(item) {
            var location = item.get('location');
            var isSubItem = item.get('isSubItem');
            if((location !== 'global' && location !== Origin.location.module) || isSubItem) {
                return;
            }
            this.$('.global-menu-inner').append(new GlobalMenuItemView({ collection: this.collection, model: item }).$el);
        },

        removeMenu: function() {
            this.$el.fadeOut(300, () => this.remove());
        }
    }, {
        template: 'globalMenu'
    });

    return GlobalMenuView;
})
