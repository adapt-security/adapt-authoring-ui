import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import glob from 'glob';
import path from 'path';
import { promisify } from 'util';

const execPromise = promisify(exec);

export default class UIDocs {
  resolvePath(relativePath, basePath) {
    if(!basePath) basePath = this.docsRootPath;
    if(basePath instanceof URL) basePath = fileURLToPath(basePath);
    return path.resolve(basePath, relativePath);
  }
  async run() {
    this.outputDir = path.resolve(this.config.outputDir, '../frontend');
    this.docsRootPath = path.resolve(this.app.dependencies['adapt-authoring-docs'].rootDir, 'jsdoc3');
    this.configPath = this.resolvePath('.jsdocConfig.json', this.config.srcDir);
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
    // update source files
    config.source.include = [
      this.resolvePath('index-ui.md', this.config.srcDir),
      ...glob.sync(`${this.app.dependencies['adapt-authoring-ui'].rootDir}/app/**/*.js`, { absolute: true })
    ].filter(f => !f.includes('/libraries/'));
    // replace first menu item
    config.docdash.menu = Object.entries(config.docdash.menu).reduce((m, [k, v], i) => {
      if(i === 0) {
        k = `<img class="logo" src="assets/logo-outline-colour.png" />Adapt authoring tool front-end documentation<br><span class="version">v${this.app.pkg.version}</span>`;
      }
      m[k] = v;
      return m;
    }, {});
    // update metadata
    config.docdash.meta.version = `v${this.app.pkg.version}`;
    config.docdash.meta.title = config.docdash.meta.description = "Adapt authoring tool front-end documentation";
    // set dest path
    config.opts.destination = this.outputDir;
    
    return fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
  }
}
