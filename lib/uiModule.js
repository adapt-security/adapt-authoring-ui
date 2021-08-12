const { AbstractModule } = require('adapt-authoring-core');
const exec = require('child_process').exec;
const fs = require('fs/promises');
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
     * Cached reference to isProduction config value
     */
    this.isProduction = this.getConfig('isProduction');
    if (!this.isProduction) {
      server.root.addMiddleware(server.static(path.join(__dirname, '../app')));
    }
    server.root
      .addMiddleware(server.static(path.join(__dirname, '..', 'build')))
      .addMiddleware(server.static(path.join(__dirname, '..', 'app', 'libraries')))
      .addRoute({ route: '/', handlers: { get: this.servePage('index') } })
      .addRoute({ route: '/loading', handlers: { get: this.servePage('loading') } });

    await this.build();
  }
  /**
   * Builds the front-end application
   * @return {Promise}
   */
  async build() {
    const force = this.app.config.get('env.aat_rebuild-ui');
    const cwd = path.resolve(__dirname, '..');
    try {
      await fs.access(path.join(cwd, 'build'));
      if(!force) return this.log('debug', 'UI build already exists, no build necessary');
    } catch(e) {
      // not an error; build doesn't exist, so run the grunt task
    } 
    return new Promise((resolve, reject) => {
      this.log('debug', 'building UI');
      exec('npx grunt build:dev', { cwd }, (error, stdout) => {
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
   * @param {String`} pageName 
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
