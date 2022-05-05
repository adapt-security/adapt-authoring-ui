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
    const config = await fs.readJson(path.join(this.docsRootPath, '.jsdocConfig.json'));
    const version = this.app.dependencyloader.configs['adapt-authoring-docs'].version;
    // update source files
    config.source.include = [
      this.resolvePath('index-ui.md', new URL(import.meta.url)),
      ...glob.sync(`${this.app.dependencies['adapt-authoring-ui'].rootDir}/app/**/*.js`, { absolute: true })
    ].filter(f => !f.includes('/libraries/'));
    // replace first menu item
    config.docdash.menu = Object.entries(config.docdash.menu).reduce((m, [k, v], i) => {
      if(i === 0) {
        k = `<img class="logo" src="assets/logo-colour.png" />Adapt authoring tool front-end documentation<br><span class="version">v${version}</span>`;
      }
      m[k] = v;
      return m;
    }, {});
    // update metadata
    config.docdash.meta.version = `v${version}`;
    config.docdash.meta.title = config.docdash.meta.description = "Adapt authoring tool front-end documentation";
    // set dest path
    config.opts.destination = this.outputDir;
    
    console.log(config);

    return fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
  }
}
