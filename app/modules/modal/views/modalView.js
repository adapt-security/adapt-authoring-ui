// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');

  var ModalView = Backbone.View.extend({
    className: 'modal',
    events: {
      'click .modal-popup-close': 'onCloseButtonClicked',
      'click .modal-popup-done': 'onDoneButtonClicked'
    },

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

      this.$('.modal-popup-content-inner').append(this.view.$el);

      return this;
    },

    setView(view, options) {
      this.view = view;
      this.options = _.extend({
        showCancelButton: true,
        showDoneButton: true,
        showScrollbar: true,
        disableCancelButton: false,
        disableDoneButton: false
      }, options.options);
      this.render();
    },

    onCloseButtonClicked(event) {
      event && event.preventDefault();
      this.hide('cancel');
    },

    onDoneButtonClicked(event) {
      event && event.preventDefault();
      this.hide('done');
    },

    show(shouldShow = true, action) {
      $('html').toggleClass('no-scroll', shouldShow);
      if(shouldShow) {
        return Origin.trigger('modal:open');
      }
      Origin.trigger(`modal:${action}`, this.view.model);
      Origin.trigger('modal:close');
      this.view.remove();
      this.remove();
    },

    hide(action) {
      this.show(false, action);
    }

  });

  return ModalView;
});
