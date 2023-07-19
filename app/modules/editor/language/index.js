import Origin from 'core/origin';
import LanguageView from './views/LanguageView'

Origin.on('editor:languages', () => {
  Origin.contentPane.setView(LanguageView);
})