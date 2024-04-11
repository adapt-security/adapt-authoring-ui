import Helpers from 'core/helpers'

class QuickLinksView extends Backbone.View {
  events() {
    return {
      'click button': 'onClick'
    }
  }

  initialize(options) {
    this.data = options;

    this.render();
  }

  render() {
    this.$el.html(Handlebars.templates[this.constructor.template](this.data));
  }

  onClick(e) {
    const className = Helpers.stringToClassName($(e.target).data('legend'))
    $('.contentPane').scrollTo(`.fieldset-${CSS.escape(className)}`)
  }
}

QuickLinksView.template = 'quicklinks'

export default QuickLinksView