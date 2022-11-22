import fs from 'fs/promises';

fs.writeFile(new URL(`../../../.rebuild-ui`, import.meta.url), ' ')
  .catch(console.log);
