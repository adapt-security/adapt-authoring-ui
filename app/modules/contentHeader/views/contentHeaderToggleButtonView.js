// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var ContentHeaderButtonView = require('./contentHeaderButtonView');

  var ContentHeaderToggleButtonView = ContentHeaderButtonView.extend({
    events() {
      return Object.assign(ContentHeaderButtonView.prototype.events, {
        'click .item': 'onItemClicked'
      });
    },
    constructor() {
      ContentHeaderButtonView.prototype.constructor.apply(this, arguments);
      $('.appHeader, .contentHeader, .contentPane').on('click', () => $('.buttons-container').removeClass('show'));
    },
    preRender() {

    },
    render() {
      if(!this.constructor.template) this.constructor.template = 'contentHeaderToggleButton';
      if(!this.data.buttonIcon) this.data.buttonIcon = this.constructor.defaultButtonIcon;
      if(!this.data.buttonText) this.data.buttonText = this.constructor.defaultButtonText;

      var itemTemplate = Handlebars.templates[this.constructor.itemTemplate];
      this.data.items = this.data.items.map((item, i) => itemTemplate(Object.assign(item, { index: i })));

      ContentHeaderButtonView.prototype.render.apply(this);
    },
    onClicked() {
      event.preventDefault();
      event.stopPropagation();
      var $btns = $('.buttons-container', this.$el);
      if(!$btns.hasClass('show')) $('.buttons-container').removeClass('show');
      $btns.toggleClass('show');
    },
    onItemClicked(event) {
    }
  });

  return ContentHeaderToggleButtonView;
});
