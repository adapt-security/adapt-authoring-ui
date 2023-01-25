// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var ContentHeader = require('modules/contentHeader/views/contentHeaderView');

  var ModalView = Backbone.View.extend({
    className: 'modal',

    initialize(options) {
      this.listenTo(Origin, 'remove:views', this.remove);
    },

    render() {
      this.$el
        .html(Handlebars.templates['modal'](this.options))
        .appendTo('body');

      this.header = new ContentHeader($('.modal-popup-header', this.$el));
      if(this.headerConfig) {
        this.header.data.title = this.headerConfig.title;
        Object.entries(this.headerConfig.buttons).forEach(([type, groups]) => this.header.setButtons(type, groups));
      }
      this.header.setTitle(this.options.title);
      this.header.setButtons(this.options.buttons);

      $('.modal-popup-content-inner', this.$el)
        .empty()
        .append(this.view && this.view.$el)

      return this;
    },

    setView(options = {}) {
      this.view = options.view;
      delete options.view;
      
      this.headerConfig = options.header;
      delete options.header;

      this.options = _.extend({ showScrollbar: true }, options.options);

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
