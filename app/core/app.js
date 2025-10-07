import Origin from 'core/origin';
import 'core/helpers';
import 'core/l10n';
import 'core/mpabc';

Origin.startSession(error => {
  if(error) console.error(error);
  Origin.initialize();
});
