// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var Backbone = require('backbone');

  var ContentHeaderButtonsView = Backbone.View.extend({
    className: 'contentHeader-button',
    tagName: 'span',

    events: {
      'click button': 'onClicked'
    },

    async initialize(options) {
      this.listenTo(Origin, 'remove:views', this.remove);

      this.data = options;
      try {
        if(this.preRender) await this.preRender();
      } catch(e) {
        return Origin.Notify.alert({ type: 'error', text: e.toString() });
      }
      this.render();
    },
    
    render() {
      var itemTemplate = Handlebars.templates[this.constructor.itemTemplate];
      this.data.groups.forEach(group => {
        group.items.forEach((item, i) => {
          item.index = i;
          item.itemHtml = itemTemplate(item);
        });
      });
      if(!this.constructor.template) this.constructor.template = 'contentHeaderButtons';
      this.$el.html(Handlebars.templates[this.constructor.template](this.data));
      return this;
    },

    onClicked(event) {
      event.preventDefault();
      event.stopPropagation();
      $item = $(event.currentTarget).parent('.item');
      const data = this.data.groups[$item.attr('data-group')].items[$item.attr('data-item')];
      Origin.trigger(`${this.data.type}:${data.eventName}`);
    }
  });

  return ContentHeaderButtonsView;
});
