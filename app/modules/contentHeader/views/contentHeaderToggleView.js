// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var ContentHeaderButtonsView = require('./contentHeaderButtonsView');

  var ContentHeaderToggleButtonView = ContentHeaderButtonsView.extend({
    constructor() {
      ContentHeaderButtonsView.prototype.constructor.apply(this, arguments);
    },
    render() {
      if(!this.constructor.template) this.constructor.template = 'contentHeaderToggleButton';
      if(!this.data.buttonIcon) this.data.buttonIcon = this.constructor.defaultButtonIcon;
      if(!this.data.buttonText) this.data.buttonText = this.constructor.defaultButtonText;

      ContentHeaderButtonsView.prototype.render.apply(this);

      console.log(this.$el);
      console.log($('.item', this.$el));

      $('.item', this.$el).on('click', this.onItemClicked.bind(this));

      setTimeout(this.repositionButtons.bind(this), 500);
    },
    repositionButtons() {
      var $btns = $('.groups', this.$el);
      var width = $btns.outerWidth(true);
      var maxX = $(window).width() - width - 5;
      if($btns.offset().left > maxX) $btns.css('left', maxX - $('.contentHeader .buttons', this.$el).offset().left);
    },
    onClicked() {
      var $btns = $('.groups', this.$el);
      if(!$btns.hasClass('show')) $('.groups', this.$el).removeClass('show');
      $btns.toggleClass('show');
    },
    onItemClicked() {}
  });

  return ContentHeaderToggleButtonView;
});
