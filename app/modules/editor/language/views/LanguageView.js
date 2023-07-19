import Origin from 'core/origin';
import OriginView from 'core/views/originView';

class LanguageView extends OriginView {

  events() {
    return {
      'click .add': 'addLanguage'
    }
  }

  async addLanguage () {
    /*
      TODO: ask user to confirm addition, noting that any missing friendly IDs will be automatically populated.
    */
    const courseId = Origin.editor.data.course.get('_courseId');
    await $.ajax({
      url: 'api/content/language',
      method: 'post',
      data: {
        courseId: courseId,
        lang: 'fr'
      },
      error: ({ responseJSON }) => Origin.Notify.alert({ type: 'error', text: responseJSON.message })
    });
  }
}

LanguageView.template = 'languages'

export default LanguageView;