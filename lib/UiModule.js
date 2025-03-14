import { AbstractModule, Hook } from 'adapt-authoring-core'
import path from 'path'
import UiBuild from './UiBuild.js'
/**
 * The main entry-point for the Adapt authoring tool web-app/front-end
 * @extends {AbstractModule}
 */
class UiModule extends AbstractModule {
  /** @override */
  async init () {
    /**
     * Source code directory for the app
     * @type {String}
     */
    this.appRoot = path.resolve(this.rootDir, 'app')
    /**
     * Source code directory for the app
     * @type {String}
     */
    this.srcDir = this.getConfig('srcDir')
    /**
     * Build code directory for the app
     * @type {String}
     */
    this.buildDir = this.getConfig('buildDir')
    /**
     * Cached reference to isProduction config value
     */
    this.isProduction = this.app.getConfig('isProduction')
    /**
     * Reference to UI plugins which need to be included in build
     * @type {String[]}
     */
    this.uiPlugins = []
    /**
     * Invoked before every UI build
     * @type {Hook}
     */
    this.preBuildHook = new Hook()
    /**
     * Invoked after every UI build
     * @type {Hook}
     */
    this.postBuildHook = new Hook()

    const server = await this.app.waitForModule('server')

    if (!this.isProduction) {
      server.root.addMiddleware(server.static(this.srcDir))
    }
    server.root
      .addMiddleware(server.static(this.buildDir))
      .addMiddleware(server.static(path.resolve(this.appRoot, 'libraries')))
      .addRoute({ route: '/', handlers: { get: this.servePage('index') } })
      .addRoute({ route: '/loading', handlers: { get: this.servePage('loading') } })

    this.app.onReady()
      .then(() => this.build())
      .then(() => this.log('info', `app available at ${this.app.config.get('adapt-authoring-server.url')}`))
  }

  /**
   * Copies a plugin to be built into the UI
   * @param {String} dir Directory to add (can contain nested plugins)
   */
  addUiPlugin (dir) {
    if (!this.uiPlugins.includes(dir)) {
      this.uiPlugins.push(dir)
      this.log('debug', 'PLUGIN_REGISTERED', dir)
    }
  }

  /**
   * Builds the front-end application
   * @return {Promise}
   */
  async build () {
    const build = new UiBuild({
      isDev: !this.isProduction,
      appRoot: this.appRoot,
      srcDir: this.srcDir,
      buildDir: this.buildDir,
      plugins: this.uiPlugins
    })
    build.preBuildHook.tap(() => this.preBuildHook.invoke(build))
    build.postBuildHook.tap(() => this.postBuildHook.invoke(build))
    await build.run()
  }

  /**
   * Serves a static HTML page
   * @param {String} pageName
   * @return {Function} Express handler function
   */
  servePage (pageName) {
    return async (req, res, next) => {
      const framework = await this.app.waitForModule('adaptframework')
      res.render(path.resolve(this.buildDir, pageName), {
        isProduction: this.isProduction,
        versions: {
          adapt_framework: framework.version,
          'adapt-authoring': this.app.pkg.version
        },
        git: { 'adapt-authoring': this.app.git },
        productName: this.app.lang.translate(req, 'app.productname')
      })
    }
  }
}

export default UiModule
