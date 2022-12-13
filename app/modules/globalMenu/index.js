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
            
            Origin.on('navigation:postRender', this.renderButton.bind(this));
            Origin.on('remove:views globalMenu:close', this.close.bind(this));
            $(document).on('click', '#app,.sidebar,.navigation', this.close.bind(this));
            this.itemStore.on('update', this.renderButton.bind(this));
        }
        renderButton() {
            if(!this.itemStore.length) {
                return;
            }
            var $btn = $(Handlebars.partials.part_globalMenuButton());
            $('.navigation .navigation-left').prepend($btn);
            $btn.on('click', this.onButtonClick.bind(this));
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
            const keys = ['location', 'text', 'icon', ['callback', 'callbackEvent', 'route']];
            if(isSubItem) keys.push('parent');
            for (const k of keys) {
                const errorMsg = 'Cannot add global menu item,';
                if(Array.isArray(k)) {
                    if(!k.some(k2 => item.hasOwnProperty(k2))) return console.log(errorMsg, `must define one of: ${k.join(', ')}`);
                    continue;
                }
                if(!item.hasOwnProperty(k)) return console.log(errorMsg, `missing ${k}`);
            }
            return true;
        }
        open() {
            this.isOpen = true;
            $('.navigation').append(new GlobalMenuView({ collection: this.itemStore }).$el);
        }
        close() {
            if(!this.isOpen) {
                return;
            }
            this.isOpen = false;
            Origin.trigger('globalMenu:globalMenuView:remove');
        }
        onButtonClick(event) {
            event.preventDefault();
            event.stopPropagation();
            this.isOpen ? this.close() : this.open();
            $('#global-menu-icon').toggleClass('open', this.isOpen);
        }
    };

    Origin.globalMenu = new GlobalMenu();
});
