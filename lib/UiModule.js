import { AbstractModule, Hook } from 'adapt-authoring-core'
import fs from 'fs/promises'
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

    const [auth, server] = await this.app.waitForModule('auth', 'server')
    // add a rebuild endpoint
    const router = server.api.createChildRouter('ui', [{ route: '/rebuild', handlers: { post: this.buildHandler() } }])
    auth.secureRoute(`${router.path}/rebuild`, 'post', ['rebuild:ui'])

    if (!this.isProduction) {
      server.root.addMiddleware(server.static(this.srcDir))
    }
    server.root
      .addMiddleware(server.static(this.buildDir))
      .addMiddleware(server.static(path.resolve(this.appRoot, 'libraries')))
      .addRoute({ route: '/', handlers: { get: this.servePage('index') } })
      .addRoute({ route: '/loading', handlers: { get: this.servePage('loading') } })

    this.app.onReady()
      .then(async () => this.build(await this.getRebuildStatus()))
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
   * Checks whether a rebuild is required
   * @return {string} The build status
   */
  async getRebuildStatus () {
    if (this.isProduction) {
      return UiBuild.BUILD_STATUS.PROD_MODE
    }
    if (this.app.args['rebuild-ui']) {
      return UiBuild.BUILD_STATUS.FORCE_FLAG
    }
    try {
      if (await UiBuild.checkBuildFileExists()) {
        return UiBuild.BUILD_STATUS.REBUILD_FILE
      }
    } catch (e) {}
    try {
      await fs.access(this.isProduction ? this.buildDir : this.srcDir)
    } catch (e) {
      if (e.code !== 'ENOENT') {
        throw e
      }
      return UiBuild.BUILD_STATUS.BUILD_MISSING
    }
    return UiBuild.BUILD_STATUS.NONE
  }

  /**
   * Builds the front-end application
   * @param {string} status Reason for build. If not provided, code will attempt to predict the need for a build.
   * @return {Promise}
   */
  async build (status = UiBuild.BUILD_STATUS.CODE_API) {
    if (status === UiBuild.BUILD_STATUS.NONE) {
      return
    }
    const build = new UiBuild({
      status,
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
   * Express handler for the rebuild endpoint
   * @return {Function} Express handler function
   */
  buildHandler () {
    return async (req, res, next) => {
      try {
        await this.build(UiBuild.BUILD_STATUS.REST_API)
        res.sendStatus(204)
      } catch (e) {
        next(e)
      }
    }
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
