// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
    var Origin = require('core/origin');
    var GlobalMenuView = require('./views/globalMenuView');

    class GlobalMenu {
        isActive = false;
        itemStore = new Backbone.Collection([
            {
                location: "global",
                text: Origin.l10n.t('app.dashboard'),
                icon: "fa-home",
                callback: () => Origin.router.navigateToDashboard(),
                sortOrder: 1
            }
        ]);
        constructor() {
            this.itemStore.comparator = 'sortOrder';
            
            Origin.on('navigation:globalMenu:toggle',this.toggle.bind(this));
            Origin.on('remove:views globalMenu:close', this.close.bind(this));
            // Listen to when the user is logger out and reset the collection as permissions
            // can be carried over from different users logging into the same machine
            Origin.on('login:changed', function() {
                if (!Origin.sessionModel.get('isAuthenticated')) {
                    GlobalMenuStore.remove(GlobalMenuStore.models);
                }
                this.renderButton();
            });
        }
        renderButton() {
            var $btn = $(Handlebars.partials.part_globalMenuButton());
            $('.navigation .navigation-left').append($btn);
            $btn.click(() => Origin.trigger('navigation:globalMenu:toggle'));
        }
        addItem(item, isSubItem) {
            const isValid = this.validateItem(item, isSubItem);
            if(!isValid) {
                return;
            }
            if (!item.hasOwnProperty('sortOrder')) item.sortOrder = 99;
            if(isSubItem) {
                item._isSubMenuItem = true;
                if (!this.itemStore.findWhere({ text: item.parent })) {
                    return console.log("Cannot add Sub Menu item as there's no parentItem", item.text);
                }
            }
            if (!this.itemStore.findWhere({ text: item.text })) this.itemStore.add(item);
        }
        validateItem(item, isSubItem = false) {
            const hasAttributes = (...keys) => keys.all(k => item.hasOwnProperty(k));
            const keys = ['location', 'text', 'icon', ['callback', 'callbackEvent']];
            if(isSubItem) keys.push('parent');
            keys.forEach(attr => {
                const errorMsg = 'Cannot add global menu item,';
                if(Array.isArray(attr)) {
                    if(!hasAttributes(...attr)) return console.log(errorMsg, `must define one of: ${attr.join(', ')}`);
                }
                if(!hasAttributes(attr)) return console.log(errorMsg, `missing ${attr}`);
            });
        }
        open() {
            this.isActive = true;
            // Add new view to the .navigation element passing in the GlobalMenuStore as the collection
            $('.navigation').append(new GlobalMenuView({ collection: this.itemStore }).$el);
            // Setup listeners to #app to remove menu when main page is clicked
            // Cheeky little defer here to stop it creating a closing loop
            _.defer(function() {
                $('#app, .sidebar, .navigation').one('click', _.bind(function(event) {
                    Origin.trigger('globalMenu:close');
                }, this));
            });
        }
        close() {
            $('#app, .sidebar').off('click');
            this.isActive = false;
            // Trigger event to remove the globalMenuView
            Origin.trigger('globalMenu:globalMenuView:remove');
            $('#global-menu-icon').removeClass('open');
        }
        toggle() {
            this.isActive ? this.close() : this.open();
        }
    };

    Origin.globalMenu = new GlobalMenu();
});
