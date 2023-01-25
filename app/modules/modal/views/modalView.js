// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');

  var ModalView = Backbone.View.extend({
    className: 'modal',

    initialize(options) {
      this.listenTo(Origin, {
        'remove:views': this.remove,
        'modal:done': this.onDoneButtonClicked,
        'modal:cancel': this.onCloseButtonClicked
      });
    },

    render() {
      this.$el
        .html(Handlebars.templates['modal'](this.options))
        .appendTo('body');

      $('.modal-popup-content-inner', this.$el)
        .empty()
        .append(this.view && this.view.$el)

      this.$('.modal-popup-close').on('click', this.onCloseButtonClicked.bind(this));
      this.$('.modal-popup-done').on('click', this.onDoneButtonClicked.bind(this));

      return this;
    },

    setView(options = {}) {
      this.view = options.view;
      delete options.view;
      this.options = _.extend({
        showCancelButton: true,
        showDoneButton: true,
        showScrollbar: true,
        disableCancelButton: false,
        disableDoneButton: false
      }, options.options);
      this.render();
      this.show();
    },

    onCloseButtonClicked(event) {
      event && event.preventDefault();
      this.show(false, 'cancel');
    },

    onDoneButtonClicked(event) {
      event && event.preventDefault();
      this.show(false, 'done');
    },

    show(shouldShow = true, action) {
      $('html').toggleClass('no-scroll', shouldShow);
      if(shouldShow) {
        return Origin.trigger('modal:open');
      }
      this.$el.remove();
      this.view && this.view.remove();
      Origin.trigger(`modal:${action}`, this.view);
      Origin.trigger('modal:close', action, this.view);
    }
  });

  return ModalView;
});
