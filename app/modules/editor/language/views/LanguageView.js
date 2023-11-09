import React from 'react';
import ReactDOM from 'react-dom';
import OriginView from 'core/views/originView';
import Origin from 'core/origin';
import Languages from './languages';

export default class LanguageView extends OriginView {

  initialize() {
    this.onAddClicked = _.bind(this.onAddClicked, this)
    this.onRemoveClicked = _.bind(this.onRemoveClicked, this)
    this.onSetDefaultClicked = _.bind(this.onSetDefaultClicked, this)
    this.listenTo(Origin, 'editorData:loaded', this.render);
    this.render();
  }

  /*
    Ask user to confirm remove
    any op will require Origin.editor.data.load()
  */

  events() {
    return {
      'click .add':'onAddClicked',
      'click .remove':'onRemoveClicked'
    }
  }

  render() {
    this.changed();

    _.defer(() => {
      this.postRender();
      Origin.trigger('languages:postRender', this);
    });
  }

  changed(eventName = null) {
    if (typeof eventName === 'string' && eventName.startsWith('bubble')) {
      // Ignore bubbling events as they are outside of this view's scope
      return;
    }
    const props = {
      ...this,
      _languages: Origin.editor.data._languages,
      _defaultLanguage: Origin.editor.data._defaultLanguage
    };
    ReactDOM.render(<Languages {...props} />, this.el);
  }

  async onAddClicked () {
    const courseId = Origin.editor.data.course.get('_courseId');
    const { SweetAlert } = Origin.Notify.alert({
      title: Origin.l10n.t('app.languageadd'),
      input: 'text',
      inputLabel: Origin.l10n.t('app.languageaddinstruction'),
      showCancelButton: true,
      showLoaderOnConfirm: true,
      inputValidator: val => {
        if (!val) return Origin.l10n.t('app.invalidempty')
        try {
          Intl.getCanonicalLocales(val)
        } catch (e) {
          return Origin.l10n.t('app.invalidlocale')
        }
      },
      preConfirm: async lang => {
        const [canonical] = Intl.getCanonicalLocales(lang)
        try {
          await $.ajax({ url: 'api/content/language', method: 'post', data: { _courseId:courseId, _lang:canonical } });
          //Origin.router.navigateTo(`editor/${courseId}/menu`);
          Origin.editor.data.load();
        } catch(e) {
          SweetAlert.showValidationMessage(e.responseJSON.message);
        }
      }
    });
  }

  async removeLanguage (lang) {
    const courseId = Origin.editor.data.course.get('_courseId');
    await $.ajax({ url: 'api/content/language', method: 'delete', data: { _courseId:courseId, _lang:lang } });
  }

  async setDefaultLanguage (lang) {
    const courseId = Origin.editor.data.course.get('_courseId');
    await $.ajax({ url: 'api/content/language', method: 'patch', data: { _courseId:courseId, _lang:lang } });
  }

  async onRemoveClicked(e) {
    const lang = $(e.target).closest('[data-lang]').data('lang')

    Origin.Notify.confirm({
      type: 'warning',
      text: Origin.l10n.t('app.languageconfirmremove'),
      callback: async ({ isConfirmed }) => {
        if(!isConfirmed) {
          return;
        }
        try {
          await this.removeLanguage(lang);
          Origin.editor.data.load();
        } catch (e) {
          const text = e.responseJSON.message
          Origin.Notify.toast({ type: 'error', title: Origin.l10n.t('app.languageremoveerror'), text });
        }
      }
    });
  }

  onSetDefaultClicked(e) {
    const lang = $(e.target).closest('[data-lang]').data('lang')

    Origin.Notify.confirm({
      type: 'warning',
      text: Origin.l10n.t('app.languageconfirmsetdefault'),
      callback: async ({ isConfirmed }) => {
        if(!isConfirmed) {
          return;
        }
        try {
          await this.setDefaultLanguage(lang);
          Origin.editor.data.load();
        } catch (e) {
          const text = e.responseJSON.message
          Origin.Notify.toast({ type: 'error', title: Origin.l10n.t('app.languagesetdefaulterror'), text });
        }
      }
    });
  }
}