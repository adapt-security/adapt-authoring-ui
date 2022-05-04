import { exec } from 'child_process';
import { fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs-extra';
import glob from 'glob';
import path from 'path';
import { promisify } from 'util';

const execPromise = promisify(exec);


export default class UIDocs {
  constructor(app, config) {
    this.app = app;
    this.outputDir = path.join(config.outputDir, 'ui');
    this.version = config.version;
    this.docsRootPath = path.join(this.app.dependencies['adapt-authoring-docs'].rootDir, 'jsdoc3') + path.sep;
    this.configPath = '';
  }
  resolvePath(relativePath, basePath) {
    if(!basePath) basePath = this.docsRootPath;
    if(typeof basePath === 'string') basePath = pathToFileURL(basePath);
    relativePath = relativePath.replaceAll('/', path.sep);
    return fileURLToPath(new URL(relativePath, basePath));
  }
  async run() {
    this.configPath = this.resolvePath('.jsdocConfig.json', new URL(import.meta.url));
    await this.writeConfig();

    await execPromise(`npx jsdoc -c ${this.configPath}`);
    await Promise.all([
      fs.copy(this.resolvePath(`./styles/adapt.css`), `${this.outputDir}/styles/adapt.css`),
      fs.copy(this.resolvePath(`./scripts/adapt.js`), `${this.outputDir}/scripts/adapt.js`),
      fs.copy(this.resolvePath(`../assets`), `${this.outputDir}/assets`)
    ]); 
  }
  async writeConfig() {
    const version = this.app.dependencyloader.configs['adapt-authoring-docs'].version;
    return fs.writeFile(this.configPath, JSON.stringify({
      "source": { 
        "include": [
          this.resolvePath('index.md', new URL(import.meta.url)),
          ...glob.sync(`${this.app.dependencies['adapt-authoring-ui'].rootDir}/app/**/*.js`, { absolute: true })
        ].filter(f => !f.includes('/libraries/'))
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
        "destination": this.outputDir,
        "template": "node_modules/docdash"
      }
    }, null, 2));
  }
}
