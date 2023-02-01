// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');

  var ContentPaneView = Backbone.View.extend({
    className: 'contentPane',

    visibleCSS: {
      opacity: 1
    },
    hiddenCSS: {
      opacity: 0
    },
    animDuration: 500,

    

    initialize: function(options) {
      this.listenToEvents();
      this.render();
    },

    listenToEvents: function() {
      this.listenTo(Origin, 'remove:views', this.removeView);
      this.$el.scroll(_.bind(this.onScroll, this));
      $(window).on('resize', _.bind(this.resize, this));
    },

    render: function() {
      this.$el.html(Handlebars.templates[this.constructor.template]());
      $('.app-inner').append(this.$el);
      return this;
    },

    setView: function(ViewClass, viewOptions = {}, options = {}) {
      const view = new ViewClass(viewOptions);
      if(!view.$el || !view.$el[0] || !_.isElement(view.$el[0])) {
        console.log('ContentPaneView.setView: expects a Backbone.View instance, received', view);
      }
      if(this.$('.contentPane-inner').html() !== '') {
        this.removeView();
      }
      this.$el.toggleClass('full-width', !!options.fullWidth);
      this.$('.contentPane-inner').html(view.$el);
      Origin.trigger('contentPane:changed');
      this.animateIn();
      setTimeout(() => this.resize(), 1);
    },

    enableScroll: function() {
      this.$el.removeClass('no-scroll');
    },

    disableScroll: function() {
      this.$el.addClass('no-scroll');
    },

    removeView: function(cb) {
      this.$('.contentPane-inner').empty();
      if(cb) cb.apply(this);
      Origin.trigger('contentPane:emptied');
    },

    animateIn: function() {
      this.$el.css(this.visibleCSS);
      Origin.trigger('contentPane:ready');
    },

    resize: function() {
      var windowHeight = $(window).height();
      this.$el.height(windowHeight - this.$el.offset().top);
    },

    onScroll: function(e) {
      Origin.trigger('contentPane:scroll', this.$el.scrollTop());
    }
  }, {
    template: 'contentPane'
  });

  return ContentPaneView;
});
