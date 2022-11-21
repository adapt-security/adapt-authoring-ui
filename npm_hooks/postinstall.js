import fs from 'fs/promises';
import path from 'path';

fs.writeFile(path.resolve(__dirname, `../../.rebuild-ui`), ' ')
  .catch(console.log);
