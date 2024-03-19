import { Hook } from 'adapt-authoring-core';
import fs from 'fs/promises';
import globCallback from 'glob';
import { promisify } from 'util';
import path from 'upath';
import handlebars from 'handlebars';
import less from 'less';
import { Gaze } from 'gaze';
import chalk from 'chalk';
import cpy from 'cpy';
import { globby as glob } from 'globby';
import JavaScriptTask from './JavaScriptTask.js';

const globPromise = promisify(globCallback);
const lessPromise = promisify(less.render);

let App;

class UiBuild {
  constructor({AppRef, isDev, buildDir}) {
    App = AppRef;
    this.isDev = isDev;
    this.workspaceDir = 'node_modules';
    this.hbsAppUi = path.join(this.workspaceDir, 'adapt-authoring-ui/app/**/*.hbs');
    this.hbsPluginUi = path.join(this.workspaceDir, 'adapt-authoring-*/ui-plugin/**/*.hbs');
    this.lessAppUi = path.join(this.workspaceDir, 'adapt-authoring-ui/app/**/*.less');
    this.lessPluginUi = path.join(this.workspaceDir, 'adapt-authoring-*/ui-plugin/**/*.less');
    this.jsAppUi = path.join(this.workspaceDir, 'adapt-authoring-ui/app/**/*.js');
    this.jsxAppUi = path.join(this.workspaceDir, 'adapt-authoring-ui/app/**/*.jsx');
    this.jsPluginUi = path.join(this.workspaceDir, 'adapt-authoring-*/ui-plugin/**/*.js');
    this.jsxPluginUi = path.join(this.workspaceDir, 'adapt-authoring-*/ui-plugin/**/*.jsx');
    this.outputDir = buildDir;
    this.outputAssetsDir = path.join(this.outputDir, 'css/assets');
    this.outputLibrariesDir = path.join(this.outputDir, 'libraries');
    this.outputFileName = 'adapt';
    this.jsTask = new JavaScriptTask(this.log, buildDir);

    this.assetsPaths = [
      path.join(this.workspaceDir, 'adapt-authoring-ui/app/**/assets/**'),
      path.join(this.workspaceDir, 'adapt-authoring-*/ui-plugin/**/assets/**')
    ]

    this.librariesPaths = [
      path.join(this.workspaceDir, 'adapt-authoring-ui/app/libraries/**/*'),
      path.join(this.workspaceDir, 'adapt-authoring-ui/app/modules/*/libraries/**/*'),
      path.join(this.workspaceDir, 'adapt-authoring-*/ui-plugin/libraries/**/*')
    ];

    this.requiredPaths = [
      path.join(this.workspaceDir, 'adapt-authoring-ui/app/core/required/**/*'),
      path.join(this.workspaceDir, 'adapt-authoring-ui/app/modules/*/required/**/*'),
      path.join(this.workspaceDir, 'adapt-authoring-*/ui-plugin/required/**/*')
    ];

    this.preBuildHook = new Hook();
    this.postBuildHook = new Hook();
  }

  collate(collateAtFolderName, destFolder, srcFileName) {
    // ignore if the srcFileName ends with the collateAtFolderName
    var nameParts = srcFileName.split('/');
    if (nameParts[nameParts.length - 1] === collateAtFolderName) {
      return destFolder;
    }

    var startOfCollatePath = srcFileName.indexOf(collateAtFolderName) + collateAtFolderName.length + 1;
    var collatedFilePath = path.join(destFolder, srcFileName.substr(startOfCollatePath));

    return collatedFilePath;
  }

  logCopy(event, dest, src) {
    this.log('info', `file ${event} ${chalk.cyan(src)}`);
    this.log('info', `copy to ${chalk.green(dest)}`);
  }

  async copyAssets() {
    // copy app assets
    const appAssets = await glob(path.join(this.workspaceDir, 'adapt-authoring-ui/app/**/assets/**'));

    await Promise.all(appAssets.map(async asset => {
      await cpy(asset, this.outputAssetsDir);
    }));

    // copy assets from UI plugins
    const pluginAssets = await glob(path.join(this.workspaceDir, 'adapt-authoring-*/ui-plugin/**/assets/**'));

    await Promise.all(pluginAssets.map(async asset => {
      await cpy(asset, this.outputAssetsDir);
    }));
  }

  async copyLibraries() {
    // copy app libs
    const cwd = path.join(this.workspaceDir, 'adapt-authoring-ui/app/libraries');
    await cpy('./**/*', this.outputLibrariesDir, { cwd });

    // copy libraries from app modules
    const moduleDirs = await glob(path.join(this.workspaceDir, 'adapt-authoring-ui/app/modules/*/libraries'), {onlyDirectories: true});

    await Promise.all(moduleDirs.map(async dir => {
      await cpy('./**/*', this.outputLibrariesDir, { cwd: dir });
    }));

    // copy libs from UI plugins
    const pluginDirs = await glob(path.join(this.workspaceDir, 'adapt-authoring-*/ui-plugin/libraries'), {onlyDirectories: true});

    await Promise.all(pluginDirs.map(async dir => {
      await cpy('./**/*', this.outputLibrariesDir, { cwd: dir });
    }));
  }

  async copyRequired() {
    // copy app required
    const cwd = path.join(this.workspaceDir, 'adapt-authoring-ui/app/core/required');
    await cpy('./**/*', this.outputDir, { cwd });

    // copy required from app modules
    const moduleDirs = await glob(path.join(this.workspaceDir, 'adapt-authoring-ui/app/modules/*/required'), {onlyDirectories: true});

    await Promise.all(moduleDirs.map(async dir => {
      await cpy('./**/*', this.outputDir, { cwd: dir });
    }));

    // copy required from UI plugins
    const pluginDirs = await glob(path.join(this.workspaceDir, 'adapt-authoring-*/ui-plugin/required'), {onlyDirectories: true});

    await Promise.all(pluginDirs.map(async dir => {
      await cpy('./**/*', this.outputDir, { cwd: dir });
    }));
  }

  async compileHandlebars() {
    const extName = '.hbs';
    const files = await globPromise(`adapt-authoring-*/**/*${extName}`, { cwd: this.workspaceDir, nodir: true, absolute: true });
    
    const results = await Promise.all(files.map(async t => {
      const compiled = handlebars.precompile((await fs.readFile(t)).toString());
      const name = path.basename(t, extName);
      const template = `Handlebars.template(${compiled})`;
      return name.startsWith('part_') ? 
        `Handlebars.registerPartial("${name}", ${template});` : 
        `Handlebars.templates["${name}"] = ${template};`;
    }));
    const output = `define(['handlebars'], function(Handlebars) {
      Handlebars.templates = Handlebars.templates || {};
      
      ${results.join('\n\n')}
      
      return Handlebars;
    });`;
    return fs.writeFile(path.join(this.outputDir, 'templates.js'), output).then(() => this.log('info', 'compiled Handlebars'));
  }

  async compileLess() {
    const cssFilename = `${this.outputFileName}.css`;
    const cssPath = path.join(this.outputDir, 'css', cssFilename);
    const lessOptions = { 
      compress: this.isDev, 
      paths: path.join(this.workspaceDir, 'adapt-authoring-ui/app/core/less')
    };
    if(this.isDev) { // source maps
      lessOptions.sourceMap = {
        sourceMapFileInline: false,
        outputSourceFiles: true,
        sourceMapBasepath: 'src',
        sourceMapURL: `${cssFilename}.map`
      };
    }
    const lessAppUi = await globPromise('adapt-authoring-ui/**/*.less', { cwd: this.workspaceDir, nodir: true, absolute: true });
    const lessPluginUi = await globPromise('adapt-authoring-*/ui-plugin/**/*.less', { cwd: this.workspaceDir, nodir: true, absolute: true });
    const files = lessAppUi.concat(lessPluginUi);
    const lessImports = files.reduce((s,p) => `${s}@import '${p}';\n`, '');
    const { css, map } = await lessPromise(lessImports, lessOptions);

    try {
      await fs.mkdir(path.join(this.outputDir, 'css'))
    } catch (e) {}

    const tasks = [fs.writeFile(cssPath, css)];
    if(map) {
      const sourceMapPath = `${cssPath}.map`;
      const importsPath = `${sourceMapPath}.imports`;
      tasks.push(
        fs.writeFile(sourceMapPath, map), 
        fs.writeFile(importsPath, lessImports)
      );
    }
    return Promise.all(tasks).then(() => this.log('info', 'compiled LESS'));
  }

  addWatches() {
    this.handlebarsWatch = new Gaze([this.hbsAppUi, this.hbsPluginUi]);
    this.lessWatch = new Gaze([this.lessAppUi, this.lessPluginUi]);
    this.jsWatch = new Gaze([this.jsAppUi, this.jsxAppUi, this.jsPluginUi, this.jsxPluginUi]);
    this.assetsWatch = new Gaze(this.assetsPaths);
    this.requiredWatch = new Gaze(this.requiredPaths);
    this.librariesWatch = new Gaze(this.librariesPaths);

    this.handlebarsWatch.on('all', this.onHandlebarsChanged.bind(this));
    this.lessWatch.on('all', this.onLessChanged.bind(this));
    this.jsWatch.on('all', this.onJavaScriptChanged.bind(this));
    this.assetsWatch.on('all', this.onAssetsChanged.bind(this));
    this.librariesWatch.on('all', this.onLibrariesChanged.bind(this));
    this.requiredWatch.on('all', this.onRequiredChanged.bind(this));
  }

  async log(level, ...rest) {
    if (App?.instance._isReady) {
      App.instance.logger.log(level, 'ui', ...rest);
    } else {
      console[args[0]].apply(console, args.slice(1));
    }
  }

  async fs(funcName, ...args) {
    try {
      await fs[funcName](...args);
      return true;
    } catch(e) { 
      if(e.code !== 'ENOENT') throw e;
      return false;
    }
  }

  async run() {
    try {
      await this.preBuildHook.invoke(this);

      await Promise.all([
        this.copyAssets(),
        this.copyLibraries(),
        this.copyRequired(),
        this.compileHandlebars(),
        this.compileLess(),
        this.jsTask.run()
      ]);

      this.addWatches();

      await this.postBuildHook.invoke(this);

      this.log('info', 'UI built successfully');
    } catch(e) {
      this.log('error', `failed to build UI, ${e}`);
    }
  }

  onHandlebarsChanged() {
    this.compileHandlebars();
  }

  onLessChanged() {
    this.compileLess();
  }

  onJavaScriptChanged() {
    this.jsTask.run();
  }

  onAssetsChanged(event, filepath) {

    const src = path.normalize(filepath);
    const dest = this.collate('assets', this.outputAssetsDir, src);

    if (event === 'deleted') return;

    this.logCopy(event, dest, src);

    fs.cp(src, dest);
  }

  onLibrariesChanged(event, filepath) {

    const src = path.normalize(filepath);
    const dest = this.collate('libraries', this.outputLibrariesDir, src);

    if (event === 'deleted') return;

    this.logCopy(event, dest, src);

    fs.cp(src, dest);
  }

  onRequiredChanged(event, filepath) {

    const src = path.normalize(filepath);
    const dest = this.collate('required', this.outputDir, src);

    if (event === 'deleted') return;

    this.logCopy(event, dest, src);

    fs.cp(src, dest);
  }
}

export default UiBuild;
