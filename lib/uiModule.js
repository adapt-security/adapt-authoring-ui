const { AbstractModule } = require('adapt-authoring-core');
const exec = require('child_process').exec;
const fs = require('fs-extra');
const path = require('path');
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
      .then(async () => {
        await this.build();
        this.log('info', `app available at ${this.app.config.get('adapt-authoring-server.url')}`);
      })
      .catch(e => this.log('error', e));
  }
  /**
   * Copies a plugin to be built into the UI
   * @param {String} dir Directory to add (can contain nested plugins)
   */
  async addUiPlugin(dir) {
    await fs.copy(dir, path.resolve(this.srcDir, 'plugins'));
  }
  /**
   * Builds the front-end application
   * @return {Promise}
   */
  async build() {
    const force = this.app.args['rebuild-ui'];
    try {
      await fs.access(this.buildDir);
      if(!force) return this.log('debug', 'UI build already exists, no build necessary');
    } catch(e) {
      // not an error; build doesn't exist, so run the grunt task
    } 
    return new Promise((resolve, reject) => {
      this.log('debug', 'building UI');
      exec('npx grunt build:dev', { cwd: this.rootDir }, (error, stdout) => {
        if(error) {
          this.log('error', `faied to build UI, ${error}`);
          if(stdout) this.log('error', stdout);
          reject(error);
        } 
        this.log('info', 'UI built successfully');
        resolve();
      });
    });
  }
  /**
   * Serves a static HTML page
   * @param {String} pageName 
   * @return {Function} Express handler function
   */
  servePage(pageName) {
    return (req, res, next) => {
      res.render(path.join(__dirname, `../app/core/${pageName}`), {
        isProduction: this.isProduction
      });
    }
  }
}

module.exports = UIModule;
