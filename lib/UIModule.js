import { AbstractModule } from 'adapt-authoring-core';
import fs from'fs-extra';
import path from 'path';
import UIBuild from './UIBuild.js';
import { fileURLToPath } from 'url';
/**
 * The main entry-point for the Adapt authoring tool web-app/front-end
 * @extends {AbstractModule}
 */
class UIModule extends AbstractModule {
  /** @override */
  async init() {
    const [framework, server] = await this.app.waitForModule('adaptframework', 'server');
    /**
     * Root directory for the app
     * @type {String}
     */
    this.rootDir = fileURLToPath(new URL('..', import.meta.url));
    /**
     * Source code directory for the app
     * @type {String}
     */
    this.srcDir = path.resolve(this.rootDir, 'app');
    /**
     * Build code directory for the app
     * @type {String}
     */
    this.buildDir = path.resolve(this.rootDir, 'build');
    /**
     * Cached reference to isProduction config value
     */
    this.isProduction = this.getConfig('isProduction');
    /**
     * Reference to UI plugins which need to be included in build
     * @type {String[]}
     */
    this.uiPlugins = [];
    /**
     * Data to be passed to the app index handlebars
     * @type {Object}
     */
    this.indexData = {
      isProduction: this.isProduction,
      productName: this.app.lang.t('app.productname'),
      versions: {
        adapt_framework: framework.version,
        'adapt-authoring': this.app.pkg.version
      }
    };
    if (!this.isProduction) {
      server.root.addMiddleware(server.static(this.srcDir));
    }
    server.root
      .addMiddleware(server.static(this.buildDir))
      .addMiddleware(server.static(path.resolve(this.srcDir, 'libraries')))
      .addRoute({ route: '/', handlers: { get: this.servePage('index') } })
      .addRoute({ route: '/loading', handlers: { get: this.servePage('loading') } });

    this.app.onReady()
      .then(() => this.build(this.app.args['rebuild-ui']))
      .then(() => this.log('info', `app available at ${this.app.config.get('adapt-authoring-server.url')}`));
  }
  /**
   * Copies a plugin to be built into the UI
   * @param {String} dir Directory to add (can contain nested plugins)
   */
  addUiPlugin(dir) {
    if(!this.uiPlugins.includes(dir)) this.uiPlugins.push(dir);
  }
  /**
   * Builds the front-end application
   * @return {Boolean} force Whether a rebuild should be forced
   * @return {Promise}
   */
  async build(force) {
    let shouldRebuild = force;
    try {
      if(!force) {
        await fs.access(this.buildDir);
        this.log('debug', 'UI build already exists, no build necessary');
      }
    } catch(e) { 
      if(e.code !== 'ENOENT') throw e; 
      shouldRebuild = true; // if buildDir doesn't exist, run rebuild
    }
    if(!shouldRebuild) {
      return;
    }
    try {
      this.log('debug', 'building UI');
      await Promise.all(this.uiPlugins.map(async p => {
        this.log('debug', `using UI plugin at ${p}`);
        const contents = await fs.readdir(p);
        return Promise.all(contents.map(c => fs.copy(path.resolve(p), path.resolve(this.srcDir, 'plugins', c))));
      }));
      await new UIBuild({
        isDev: !this.isProduction,
        srcDir: this.srcDir,
        buildDir: this.buildDir
      }).run();
      this.log('info', 'UI built successfully');
    } catch(e) {
      this.log('error', `failed to build UI, ${e}`);
    }
  }
  /**
   * Serves a static HTML page
   * @param {String} pageName 
   * @return {Function} Express handler function
   */
  servePage(pageName) {
    return (req, res, next) => {
      res.render(fileURLToPath(new URL(`../app/core/${pageName}`, import.meta.url)), this.indexData);
    }
  }
}

export default UIModule;