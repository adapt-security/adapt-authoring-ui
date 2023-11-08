import Origin from 'core/origin';
import OriginView from 'core/views/originView';

class LanguageView extends OriginView {

  events() {
    return {
      'click .add': 'addLanguage',
      'click .remove': 'removeLanguage'
    }
  }

  async addLanguage () {
    /*
      TODO: ask user to confirm addition, noting that any missing friendly IDs will be automatically populated.
    */
    const courseId = Origin.editor.data.course.get('_courseId');
    const { SweetAlert } = Origin.Notify.alert({
      title: Origin.l10n.t('app.addnewproject'),
      input: 'text',
      inputLabel: Origin.l10n.t('app.addlanguageinstruction'),
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
          await $.ajax({ url: 'api/content/language', method: 'post', data: { courseId, lang:canonical } });
          Origin.router.navigateTo(`editor/${courseId}/menu`);
        } catch(e) {
          SweetAlert.showValidationMessage(e.responseJSON.message);
        }
      }
    });
  }
}

LanguageView.template = 'languages'

export default LanguageView;