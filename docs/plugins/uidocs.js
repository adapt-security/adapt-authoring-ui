import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import glob from 'glob';
import { promisify } from 'util';

const execPromise = promisify(exec);

const configPath = resolvePath('.jsdocConfig.json');
let docsRootPath;

let cachedConfigs;

function resolvePath(relativePath) {
  return fileURLToPath(new URL(relativePath, import.meta.url));
}

async function writeConfig(app, outputdir, indexFile) {
  const version = app.pkg.version;
  return fs.writeFile(configPath, JSON.stringify({
    "source": { 
      "include": getSourceIncludes(indexFile) 
    },
    "docdash": {
      "collapse": true,
      "typedefs": true,
      "search": false,
      "static": true,
      "menu": {
        [`<img class="logo" src="assets/logo-colour.png" />Adapt authoring tool UI documentation<br><span class="version">v${version}</span>`]: {
          "class":"menu-title"
        },
        "Home": {
          "href":"index.html",
          "target":"_self",
          "class":"menu-item",
          "id":"home_link"
        },
        "Project Website": {
          "href":"https://www.adaptlearning.org/",
          "target":"_blank",
          "class":"menu-item",
          "id":"website_link"
        },
        "Technical Discussion Forum": {
          "href":"https://community.adaptlearning.org/mod/forum/view.php?id=4",
          "target":"_blank",
          "class":"menu-item",
          "id":"forum_link"
        }
      },
      "meta": {
        "title": "Adapt authoring tool UI documentation",
        "keyword": `v${version}`
      },
      "scripts": [
        'styles/adapt.css',
        'scripts/adapt.js'
      ],
    },
    "opts": {
      "destination": outputdir,
      "template": "node_modules/docdash"
    }
  }, null, 2));
}
/**
 * Returns a list of modules to include.
 * @note Source files must be located in /lib
 */
function getSourceIncludes(indexFile) {
  const includes = cachedConfigs.reduce((i, c) => {
    return i.concat(glob.sync('app/**/*.js', { cwd: c.rootDir, absolute: true }));
  }, []);
  if(indexFile) includes.push(indexFile);
  return includes;
}

export default async function jsdoc3(app, configs, outputdir, sourceIndexFile) {
  const dir = `${outputdir}/ui`;
  await writeConfig(app, dir, sourceIndexFile);
  await execPromise(`npx jsdoc -c ${configPath}`);
  await Promise.all([
    fs.copy(resolvePath(`./styles/adapt.css`), `${dir}/styles/adapt.css`),
    fs.copy(resolvePath(`./scripts/adapt.js`), `${dir}/scripts/adapt.js`),
    fs.copy(resolvePath(`../assets`), `${dir}/assets`)
  ]);
}