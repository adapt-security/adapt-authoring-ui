import Origin from 'core/origin';
import 'core/helpers';
import 'core/l10n';

Origin.startSession(error => {
  if(error) console.error(error);
  Origin.initialize();
});
