import { App, Hook } from 'adapt-authoring-core'
import babel from '@babel/core'
import fs from 'fs/promises'
import { glob } from 'glob'
import handlebars from 'handlebars'
import less from 'less'
import path from 'path'
import { promisify } from 'util'
import requirejs from 'requirejs'

const lessPromise = promisify(less.render)
/**
 * Builds the AAT user interface
 * @memberof ui
 */
class UiBuild {
  /**
   * @constructor
   * @param {object} options Whether this is a development build
   * @param {boolean} options.isDev Whether this is a development build
   * @param {string} options.appRoot Root dir for the main adapt-authoring app
   * @param {string} options.srcDir Root dir for the UI source code
   * @param {string} options.buildDir Build dir for the output files
   * @param {array} options.plugins Any custom UI plugins
   */
  constructor ({ isDev, appRoot, srcDir, buildDir, plugins }) {
    this.isDev = isDev
    this.appRoot = appRoot
    this.srcDir = srcDir
    this.buildDir = buildDir
    this.outputFileName = 'adapt'
    this.plugins = plugins
    this.rebuildFilePath = path.join(App.instance.rootDir, '.rebuild-ui')
    this.outputJsDir = path.join(this.buildDir, 'js')
    this.outputJsFilePath = path.join(this.outputJsDir, `${this.outputFileName}.js`)
    this.requireJsConfigPath = path.join(this.outputJsDir, 'requireJsConfig.js')
    this.requireJsConfig = {
      baseUrl: srcDir,
      name: 'core/app',
      out: this.outputJsFilePath,
      preserveLicenseComments: isDev,
      waitSeconds: 0,
      paths: {
        'modules/modules': 'modules-bundle',
        'plugins/plugins': 'plugins-bundle',
        'templates/templates': 'templates',
        backbone: 'libraries/backbone',
        backboneForms: 'libraries/backbone-forms',
        backboneFormsLists: 'libraries/backbone-forms-lists',
        ckeditor: 'libraries/ckeditor',
        handlebars: 'libraries/handlebars',
        imageReady: 'libraries/imageReady',
        inview: 'libraries/inview',
        jquery: 'libraries/jquery',
        jqueryForm: 'libraries/jquery.form',
        jqueryTagsInput: 'libraries/jquery.tagsinput.min',
        jqueryUI: 'libraries/jquery-ui.min',
        moment: 'libraries/moment.min',
        polyfill: 'libraries/babel-polyfill.min',
        polyglot: 'libraries/polyglot.min',
        scrollTo: 'libraries/scrollTo',
        selectize: 'libraries/selectize/js/selectize',
        underscore: 'libraries/underscore',
        velocity: 'libraries/velocity'
      },
      shim: {
        'templates/templates': { deps: ['handlebars'] },
        // third-party
        backbone: {
          deps: ['underscore', 'jquery'],
          exports: 'Backbone'
        },
        backboneForms: {
          deps: ['backbone']
        },
        backboneFormsLists: {
          deps: ['backboneForms']
        },
        handlebars: {
          exports: 'Handlebars'
        },
        imageReady: {
          deps: ['jquery'],
          exports: 'imageready'
        },
        inview: {
          deps: ['jquery'],
          exports: 'inview'
        },
        jqueryForm: {
          deps: ['jquery'],
          exports: '$'
        },
        jqueryTagsInput: {
          deps: ['jquery'],
          exports: '$'
        },
        jqueryUI: {
          deps: ['jquery'],
          exports: '$'
        },
        moment: {
          exports: 'moment'
        },
        polyglot: {
          exports: 'Polyglot'
        },
        scrollTo: {
          deps: ['jquery'],
          exports: 'scrollTo'
        },
        selectize: {
          deps: ['jquery'],
          exports: '$'
        },
        underscore: {
          exports: '_'
        },
        velocity: {
          deps: ['jquery'],
          exports: 'velocity'
        }
      }
    }
    this.preBuildHook = new Hook()
    this.postBuildHook = new Hook()
  }
  /**
   * Wrapper for filesystem (fs) functions
   * @param {string} function Function to run
   * @return {boolean} Whether the process was successful
   */
  async fs (funcName, ...args) {
    try {
      await fs[funcName](...args)
      return true
    } catch (e) {
      if (e.code !== 'ENOENT') throw e
      return false
    }
  }
  /**
   * Initialises the expected build folder structure
   * @return {Promise}
   */
  async initBuildFolder () {
    await this.fs('rm', this.srcDir, { recursive: true })
    await this.fs('rm', this.buildDir, { recursive: true })
    await this.fs('mkdir', path.resolve(this.buildDir, 'css'), { recursive: true })
    await this.fs('mkdir', this.srcDir, { recursive: true })
    await this.fs('mkdir', this.outputJsDir, { recursive: true })
  }
  /**
   * Copies any specified UI plugins into place
   * * @return {Promise}
   */
  async copyPlugins () {
    return Promise.all(this.plugins.map(async p => {
      const contents = await fs.readdir(p)
      return Promise.all(contents.map(c => fs.cp(path.resolve(p, c), path.resolve(this.srcDir, 'plugins', c), { recursive: true, force: true })))
    }))
  }
  /**
   * Creates bundle files for the relevant RequireJS files
   * @return {Promise}
   */
  async bundleRequireImports () {
    return Promise.all(['modules', 'plugins'].map(async type => {
      const modulePaths = []
      let modules = []
      try {
        modules = await fs.readdir(path.resolve(this.srcDir, type))
      } catch (e) {} // folder doesn't exist, no problem

      await Promise.all(modules.map(async m => {
        try {
          const relPath = `${type}/${m}/index.js`
          await fs.stat(path.resolve(this.srcDir, relPath))
          modulePaths.push(relPath)
        } catch (e) {}
      }))
      fs.writeFile(`${this.isDev ? this.buildDir : this.srcDir}/${type}-bundle.js`, `define(${JSON.stringify(modulePaths)}, function() {});`)
    }))
  }
  /**
   * Copy assets
   * @return {Promise}
   */
  async copyAssets () {
    const outputDir = `${this.buildDir}/css/assets`
    fs.mkdir(outputDir, { recursive: true })
    const assets = await this.getFiles('**/assets/**')
    return Promise.all(assets.map(a => fs.copyFile(a, `${outputDir}/${path.basename(a)}`)))
  }
  /**
   * Copy handlebars templates
   * @return {Promise}
   */
  async copyHbs () {
    const files = ['index.hbs', 'loading.hbs']
    return Promise.all(files.map(f => fs.copyFile(`${this.srcDir}/core/${f}`, `${this.buildDir}/${f}`)))
  }
  /**
   * Copy source code files
   * @return {Promise}
   */
  async copySource () {
    return fs.cp(this.appRoot, this.srcDir, { recursive: true })
  }
  /**
   * Run LESS tooling to generate output CSS file
   * @return {Promise}
   */
  async compileLess () {
    const cssFilename = `${this.outputFileName}.css`
    const cssPath = path.join(this.buildDir, 'css', cssFilename)
    const lessOptions = {
      compress: this.isDev,
      paths: `${this.srcDir}/core/less`
    }
    if (this.isDev) { // source maps
      lessOptions.sourceMap = {
        sourceMapFileInline: false,
        outputSourceFiles: true,
        sourceMapBasepath: 'src',
        sourceMapURL: `${cssFilename}.map`
      }
    }
    const lessImports = (await this.getFiles('**/*.less')).sort().reduce((s, p) => `${s}@import '${p}';\n`, '')
    const { css, map } = await lessPromise(lessImports, lessOptions)
    const tasks = [fs.writeFile(cssPath, css)]
    if (map) {
      const sourceMapPath = `${cssPath}.map`
      const importsPath = `${sourceMapPath}.imports`
      tasks.push(
        fs.writeFile(sourceMapPath, map),
        fs.writeFile(importsPath, lessImports)
      )
    }
    return Promise.all(tasks)
  }
  /**
   * Compile handlebars templates and merge into single file
   * @return {Promise}
   */
  async compileHandlebars () {
    const extName = '.hbs'
    const results = await Promise.all((await this.getFiles(`**/*${extName}`)).map(async t => {
      const compiled = handlebars.precompile((await fs.readFile(t)).toString())
      const name = path.basename(t, extName)
      const template = `Handlebars.template(${compiled})`
      return name.startsWith('part_')
        ? `Handlebars.registerPartial("${name}", ${template});`
        : `Handlebars.templates["${name}"] = ${template};`
    }))
    const output = `define(['handlebars'], function(Handlebars) {
      Handlebars.templates = Handlebars.templates || {};
      
      ${results.join('\n\n')}
      
      return Handlebars;
    });`
    return fs.writeFile(path.join(this.isDev ? this.buildDir : this.srcDir, 'templates.js'), output)
  }
  /**
   * Write RequireJS config data to file
   * @return {Promise}
   */
  async writeRequireJsConfig () {
    const config = { ...this.requireJsConfig }
    if (this.isDev) config.baseUrl = '/'
    await this.fs('writeFile', this.requireJsConfigPath, `require.config(${JSON.stringify(config, null, 2)});`)
  }
  /**
   * Runs the RequireJS tooling
   * @return {Promise}
   */
  async runRequireJs () {
    return new Promise((resolve, reject) => requirejs.optimize(this.requireJsConfig, resolve, reject))
  }
  /**
   * Runs the babel tooling
   * @return {Promise}
   */
  async runBabel () {
    const opts = Object.assign({
      cwd: this.srcDir,
      presets: [['@babel/preset-env', { targets: { ie: '11' } }]],
      sourceType: 'script'
    }, this.isDev // add task-specific options
      ? { compact: false, retainLines: true }
      : { comments: false, minified: true }
    )
    const { code } = await babel.transformFileAsync(this.outputJsFilePath, opts)
    return fs.writeFile(this.outputJsFilePath, code)
  }
  /**
   * Returns list of source files
   * @param {string} globPattern Glob pattern to specify files
   * @return {Promise}
   */
  async getFiles (globPattern) {
    return glob(globPattern, { cwd: this.srcDir, nodir: true, absolute: true })
  }
  /**
   * Main entry point, runs the build process
   * @return {Promise}
   */
  async run () {
    const forceRebuildFlag = App.instance.args['rebuild-ui']
    let rebuildFileExists = false
    try {
      rebuildFileExists = await this.fs('access', this.rebuildFilePath, fs.W_OK)
    } catch (e) {}
    const buildExists = await this.fs('access', this.buildDir)
    const srcExists = await this.fs('access', this.srcDir)
    const shouldRebuild = forceRebuildFlag || rebuildFileExists || !buildExists || (this.isDev && !srcExists)
    if (!shouldRebuild) {
      return
    }
    let rebuildReason = 'no build exists'
    if (forceRebuildFlag) rebuildReason = '--rebuild-ui flag passed'
    else if (rebuildFileExists) rebuildReason = `${path.basename(this.rebuildFilePath)} file found`

    this.log('info', `${rebuildReason}, building UI in ${this.isDev ? 'dev' : 'production'} mode`)
    try {
      await this.initBuildFolder()
      await Promise.all([
        this.copySource(),
        this.copyPlugins()
      ])
      await this.preBuildHook.invoke(this)
      await Promise.all([
        this.bundleRequireImports(),
        this.copyAssets(),
        this.copyHbs(),
        this.compileLess(),
        this.compileHandlebars(),
        this.writeRequireJsConfig()
      ])
      if (!this.isDev) {
        await this.runRequireJs()
        await this.runBabel()
        await this.fs('rm', this.srcDir, { recursive: true })
      }
      try {
        await this.fs('rm', this.rebuildFilePath)
      } catch (e) {} // ignore
      await this.postBuildHook.invoke(this)

      this.log('info', 'UI built successfully')
    } catch (e) {
      this.log('error', `failed to build UI, ${e}`)
    }
  }
  /**
   * Shim for logging via the ui module
   * @return {Promise}
   */
  async log (...args) {
    const ui = await App.instance.waitForModule('ui')
    ui.log(...args)
  }
}

export default UiBuild
