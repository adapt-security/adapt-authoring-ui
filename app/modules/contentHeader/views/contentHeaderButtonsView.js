// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var Backbone = require('backbone');

  var ContentHeaderButtonsView = Backbone.View.extend({
    className: 'contentHeader-button',
    tagName: 'span',

    async initialize(options) {
      this.listenTo(Origin, 'remove:views', this.remove);

      this.data = options;
      try {
        if(this.preRender) await this.preRender();
      } catch(e) {
        console.error(e);
      }
      this.render();
    },
    
    render() {
      var itemTemplate = Handlebars.templates[this.constructor.itemTemplate];
      this.data.groups.forEach((group, groupIndex) => {
        group.index = groupIndex;
        group.items.forEach((item, itemIndex) => {
          item.index = itemIndex;
          item.uniqueId = `${this.data.eventId ? `${this.data.eventId}-` : ''}${groupIndex}-${itemIndex}`;
          item.itemHtml = itemTemplate(Object.assign(item, { eventId: this.data.eventId, group }));
        });
      });
      if(!this.constructor.template) this.constructor.template = 'contentHeaderButtons';
      this.$el.html(Handlebars.templates[this.constructor.template](this.data));

      $('button', this.$el).on('click', this.onClicked.bind(this));

      return this;
    },

    triggerEvent(data, id) {
      const eventName = `${this.data.eventId ? `${this.data.eventId}:` : ''}${this.data.type}`;
      if(!id) {
        return Origin.trigger(eventName, data);
      }
      Origin.trigger(`${eventName}:${id}`, data);
      Origin.trigger(eventName, id, data);
    },

    onClicked(event) {
      event.preventDefault();
      event.stopPropagation();
      const $item = $(event.currentTarget).parents('.item');
      const data = this.data.groups[$item.parents('.group').attr('data-index')].items[$item.attr('data-index')];
      this.triggerEvent(data.eventData, data.id);
    }
  });

  return ContentHeaderButtonsView;
});
