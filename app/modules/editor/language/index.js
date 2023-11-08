import Origin from 'core/origin';
import LanguageView from './views/LanguageViewReact'

Origin.on('editor:languages', () => {
  Origin.contentPane.setView(LanguageView);
})