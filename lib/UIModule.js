const { AbstractModule } = require('adapt-authoring-core');
const fs = require('fs-extra');
const path = require('path');
const UIBuild = require('./UIBuild');
/**
 * The main entry-point for the Adapt authoring tool web-app/front-end
 * @extends {AbstractModule}
 */
class UIModule extends AbstractModule {
  /** @override */
  async init() {
    const server = await this.app.waitForModule('server');
    /**
     * Root directory for the app
     * @type {String}
     */
    this.rootDir = path.resolve(__dirname, '../');
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
    if (!this.isProduction) {
      server.root.addMiddleware(server.static(this.srcDir));
    }
    server.root
      .addMiddleware(server.static(this.buildDir))
      .addMiddleware(server.static(path.resolve(this.srcDir, 'libraries')))
      .addRoute({ route: '/', handlers: { get: this.servePage('index') } })
      .addRoute({ route: '/loading', handlers: { get: this.servePage('loading') } });

    this.app.onReady()
      .then(this.build(this.app.args['rebuild-ui']))
      .then(this.log('info', `app available at ${this.app.config.get('adapt-authoring-server.url')}`));
  }
  /**
   * Copies a plugin to be built into the UI
   * @param {String} dir Directory to add (can contain nested plugins)
   */
  async addUiPlugin(dir) {
    const contents = await fs.readdir(dir);
    return Promise.all(contents.map(c => fs.copy(path.resolve(dir, c), path.resolve(this.srcDir, 'plugins', c))));
  }
  /**
   * Builds the front-end application
   * @return {Boolean} force Whether a rebuild should be forced
   * @return {Promise}
   */
  async build(force) {
    try {
      if(!force) {
        await fs.access(this.buildDir);
        return this.log('debug', 'UI build already exists, no build necessary');
      }
    } catch(e) { 
      if(e.code !== 'EEXIST') throw e; // if buildDir doesn't exist, we can continue with build
    } finally {
      try {
        this.log('debug', 'building UI');
        await new UIBuild().run();
        this.log('info', 'UI built successfully');
      } catch(e) {
        this.log('error', `failed to build UI, ${error}`);
      }
    }
  }
  /**
   * Serves a static HTML page
   * @param {String} pageName 
   * @return {Function} Express handler function
   */
  servePage(pageName) {
    return (req, res, next) => {
      res.render(path.join(__dirname, `../app/core/${pageName}`), {
        isProduction: this.isProduction,
        productName: this.app.lang.t('app.productname')
      });
    }
  }
}

module.exports = UIModule;
