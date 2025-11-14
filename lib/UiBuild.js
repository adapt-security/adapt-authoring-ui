import { Hook } from 'adapt-authoring-core'
import fs from 'fs/promises'
import { glob } from 'glob'
import path from 'upath'
import handlebars from 'handlebars'
import less from 'less'
import { Gaze } from 'gaze'
import chalk from 'chalk'
import JavaScriptTask from './JavaScriptTask.js'

class UiBuild {
  constructor ({ app, log, isDev, buildDir, enableWatch }) {
    this.app = app
    this.log = log
    this.isDev = isDev
    this.enableWatch = enableWatch

    const outputDir = buildDir.replaceAll('\\', '/')

    this.Paths = {
      App: 'node_modules/adapt-authoring-ui/app',
      Plugins: 'node_modules/adapt-authoring-*/ui-plugins',
      Output: outputDir,
      OutputDirs: {
        assets: `${outputDir}/css/assets`,
        libraries: `${outputDir}/libraries`,
        required: outputDir
      }
    }
    this.Globs = {
      assets: [
        `${this.Paths.App}/**/assets/**`,
        `${this.Paths.Plugins}/**/assets/**`
      ],
      libraries: [
        `${this.Paths.App}/libraries/**/*`,
        `${this.Paths.App}/modules/*/libraries/**/*`,
        `${this.Paths.Plugins}/libraries/**/*`
      ],
      required: [
        `${this.Paths.App}/core/required/**/*`,
        `${this.Paths.App}/modules/*/required/**/*`,
        `${this.Paths.Plugins}/required/**/*`
      ],
      hbs: [
        `${this.Paths.App}/**/*.hbs`,
        `${this.Paths.Plugins}/**/*.hbs`
      ],
      js: [
        `${this.Paths.App}/**/*.js`,
        `${this.Paths.App}/**/*.js`,
        `${this.Paths.Plugins}/**/*.js`,
        `${this.Paths.Plugins}/**/*.jsx`
      ],
      less: [
        `${this.Paths.App}/**/*.less`,
        `${this.Paths.Plugins}/**/*.less`
      ]
    }

    this.preBuildHook = new Hook()
    this.postBuildHook = new Hook()

    this.jsTask = new JavaScriptTask(this.Paths.Output, this.log)
  }

  collate (collateAtFolderName, destFolder, srcFileName) {
    // ignore if the srcFileName ends with the collateAtFolderName
    const nameParts = srcFileName.split('/')
    if (nameParts[nameParts.length - 1] === collateAtFolderName) {
      return destFolder
    }
    const startOfCollatePath = srcFileName.indexOf(collateAtFolderName) + collateAtFolderName.length + 1
    return path.join(destFolder, srcFileName.substr(startOfCollatePath))
  }

  logCopy (event, dest, src) {
    this.log('verbose', `file ${event} ${chalk.cyan(src)} => ${chalk.green(dest)}`)
  }

  logBuildError (e) {
    this.log('error', `failed to build UI, ${e}`)
    this.log('verbose', e)
  }

  async cleanOutputDir () {
    try {
      await fs.rm(this.Paths.Output, { recursive: true })
      await fs.mkdir(this.Paths.Output)
    } catch (e) {
      if (e.code !== 'ENOENT') {
        if (this.app.errors[e.code]) throw this.app.errors[e.code].setData({ path: this.Paths.Output })
        throw e
      }
    }
  }

  async copyFiles () {
    const files = []
    await Promise.all(['assets', 'libraries', 'required'].map(async type => {
      const matches = await glob(this.Globs[type], { nodir: true, posix: true })
      matches.forEach(m => {
        const relativePath = m.split(type)[1]
        files.push([m, path.join(this.Paths.OutputDirs[type], relativePath)])
      })
    }))
    await Promise.all(files.map(async ([src, dest]) => fs.cp(src, dest)))
  }

  async compileHandlebars () {
    try {
      const files = (await glob(this.Globs.hbs, { nodir: true, absolute: true }))
      const results = await Promise.all(files.map(async t => {
        const compiled = handlebars.precompile((await fs.readFile(t)).toString())
        const name = path.basename(t, '.hbs')
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
      await fs.writeFile(`${this.Paths.Output}/templates.js`, output)
      this.log('debug', 'compiled Handlebars')
    } catch (e) {
      this.logBuildError(e)
    }
  }

  async compileLess () {
    const cssPath = `${this.Paths.Output}/css/adapt.css`
    const lessOptions = {
      compress: this.isDev,
      paths: `${this.Paths.App}/core/less`
    }
    if (this.isDev) { // source maps
      lessOptions.sourceMap = {
        sourceMapFileInline: false,
        outputSourceFiles: true,
        sourceMapBasepath: 'src',
        sourceMapURL: 'adapt.css.map'
      }
    }
    const files = await glob(this.Globs.less, { nodir: true, absolute: true })
    const [core, theRest] = files.reduce((sorted, f) => {
      const isCore = f.replaceAll('\\', '/').includes('adapt-authoring-ui/app/core')
      isCore ? sorted[0].push(f) : sorted[1].push(f)
      return sorted
    }, [[], []])
    const lessImports = [...core, ...theRest].reduce((s, p) => `${s}@import '${p}';\n`, '')
    const { css, map } = await less.render(lessImports, lessOptions)

    try {
      await fs.mkdir(`${this.Paths.Output}/css`)
    } catch (e) {}

    const tasks = [fs.writeFile(cssPath, css)]
    if (map) {
      const sourceMapPath = `${cssPath}.map`
      const importsPath = `${sourceMapPath}.imports`
      tasks.push(
        fs.writeFile(sourceMapPath, map),
        fs.writeFile(importsPath, lessImports)
      )
    }
    try {
      await Promise.all(tasks)
      this.log('debug', 'compiled LESS')
    } catch (e) {
      this.logBuildError(e)
    }
  }

  compileJs () {
    this.jsTask.run()
  }

  addWatch (globs, callback) {
    return new Gaze(globs).on('all', (event, filepath) => {
      this.log('debug', 'WATCH', event.toUpperCase(), filepath)
      callback(event, filepath)
    })
  }

  addWatches () {
    this.addWatch(this.Globs.hbs, this.compileHandlebars.bind(this))
    this.addWatch(this.Globs.less, this.compileLess.bind(this))
    this.addWatch(this.Globs.js, this.compileJs)
    this.addWatch(this.Globs.assets, this.onChanged('assets', this.Paths.OutputAssets))
    this.addWatch(this.Globs.required, this.onChanged('required', this.Paths.Output))
    this.addWatch(this.Globs.libraries, this.onChanged('libraries', this.Paths.OutputLibraries))
  }

  async run () {
    try {
      await this.preBuildHook.invoke(this)

      await this.cleanOutputDir()

      await Promise.all([
        this.copyFiles(),
        this.compileHandlebars(),
        this.compileLess(),
        this.compileJs()
      ])
      if (this.enableWatch) {
        this.log('info', 'watching UI files for changes')
        this.addWatches()
      }
      await this.postBuildHook.invoke(this)

      this.log('info', 'UI built successfully')
    } catch (e) {
      this.logBuildError(e)
    }
  }

  onChanged (type, dir) {
    return async (event, filepath) => {
      if (event === 'deleted') {
        return
      }
      try {
        const src = path.normalize(filepath)
        const dest = this.collate(type, dir, src)
        await fs.cp(src, dest)
        this.logCopy(event, dest, src)
      } catch (e) {
        this.log('error', e)
      }
    }
  }
}

export default UiBuild
