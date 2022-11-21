import path from 'path';
import { pathToFileURL } from 'url';

console.log('UI postinstall', path.resolve(`../../conf/${process.NODE_ENV}.config.js`));

import(pathToFileURL(path.resolve(`../../conf/${process.NODE_ENV}.config.js`))).then(config => {
  console.log(config);
});