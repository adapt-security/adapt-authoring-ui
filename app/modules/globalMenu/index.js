// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
    var Origin = require('core/origin');
    var GlobalMenuView = require('./views/globalMenuView');

    class GlobalMenu {
        isOpen = false;
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
            
            Origin.on('login:changed', function() {
                if(!Origin.sessionModel.get('isAuthenticated')) this.itemStore.remove(this.itemStore.models);
            });
            Origin.on('origin:dataReady', this.renderButton.bind(this));
            Origin.on('navigation:globalMenu:toggle',this.toggle.bind(this));
            Origin.on('remove:views globalMenu:close', this.close.bind(this));
        }
        renderButton() {
            if(!this.itemStore.length) {
                return;
            }
            var $btn = $(Handlebars.partials.part_globalMenuButton());
            $('.navigation .navigation-left').prepend($btn);
            $btn.click(() => Origin.trigger('navigation:globalMenu:toggle'));
        }
        addItem(item, isSubItem) {
            const isValid = this.validateItem(item, isSubItem);
            if(!isValid) {
                return;
            }
            if (!item.hasOwnProperty('sortOrder')) item.sortOrder = 99;
            if(isSubItem) {
                item.isSubItem = true;
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
            this.isOpen = true;
            $('.navigation').append(new GlobalMenuView({ collection: this.itemStore }).$el);
            // Setup listeners to #app to remove menu when main page is clicked
            // Cheeky little defer here to stop it creating a closing loop
            _.defer(() => $('#app, .sidebar, .navigation').one('click', () => Origin.trigger('globalMenu:close')));
        }
        close() {
            $('#app, .sidebar').off('click');
            this.isOpen = false;
            // Trigger event to remove the globalMenuView
            Origin.trigger('globalMenu:globalMenuView:remove');
            $('#global-menu-icon').removeClass('open');
        }
        toggle() {
            this.isOpen ? this.close() : this.open();
        }
    };

    Origin.globalMenu = new GlobalMenu();
});
