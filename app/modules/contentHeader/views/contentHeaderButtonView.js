// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var Backbone = require('backbone');

  var ContentHeaderButtonView = Backbone.View.extend({
    className: 'contentHeader-button',
    tagName: 'span',

    events: {
      'click button': 'onClicked'
    },

    async initialize(options) {
      this.listenTo(Origin, 'remove:views', this.remove);

      this.data = options;
      if(!this.data.buttonClass) this.data.buttonClass = 'action-primary';
      try {
        await this.preRender();
      } catch(e) {
        return Origin.Notify.alert({ type: 'error', text: e.toString() });
      }
      this.render();
      setTimeout(this.postRender.bind(this), 0);
    },
    
    async preRender() {},
    
    render() {
      this.$el.html(Handlebars.templates[this.constructor.template](this.data));
      return this;
    },

    postRender() {},

    onClicked(event) {
      event.preventDefault();
      event.stopPropagation();
      Origin.trigger(`${this.data.type}:${this.data.eventName}`);
    }
  });

  return ContentHeaderButtonView;
});
