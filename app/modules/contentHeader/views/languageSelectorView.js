import Origin from 'core/origin'

class LanguageSelectorView extends Backbone.View {
  events() {
    return {
      'change select': 'onChange'
    }
  }

  initialize(options) {
    this.data = options;

    this.render();
  }

  render() {
    this.$el.html(Handlebars.templates[this.constructor.template](this.data));
  }

  onChange(e) {
    const lang = e.currentTarget.value;
    Origin.editor.data.selectLanguage(lang)
  }
}

LanguageSelectorView.template = 'languageSelector'

export default LanguageSelectorView