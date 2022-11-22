import { App, Hook } from 'adapt-authoring-core';
import babel from '@babel/core';
import fs from 'fs/promises';
import globCallback from 'glob';
import handlebars from 'handlebars';
import less from 'less';
import path from 'path';
import { promisify } from 'util';
import requirejs from 'requirejs';

const globPromise = promisify(globCallback);
const lessPromise = promisify(less.render);

class UiBuild {
  constructor({ isDev, srcDir, buildDir, plugins }) {
    this.isDev = isDev;
    this.srcDir = srcDir;
    this.buildDir = buildDir;
    this.outputFileName = 'adapt';
    this.plugins = plugins;
    this.rebuildFilePath = path.join(App.instance.rootDir, '.rebuild-ui');
    this.outputJsPath = `${this.buildDir}/js/${this.outputFileName}.js`;
    this.preBuildHook = new Hook();
  }

  async fs(funcName, ...args) {
    try {
      return fs[funcName](...args);
    } catch(e) { 
      if(e.code !== 'ENOENT') throw e;
      return false;
    }
  }

  async initBuildFolder() {
    await this.fs('rm', this.buildDir, { recursive: true });
    await this.fs('mkdir', path.resolve(this.buildDir, 'css'), { recursive: true });
    await this.fs('mkdir', path.resolve(this.buildDir, 'js'), { recursive: true });
  }

  async copyPlugins() {
    return Promise.all(this.plugins.map(async p => {
      const contents = await fs.readdir(p);
      return Promise.all(contents.map(c => fs.copy(path.resolve(p), path.resolve(this.srcDir, 'plugins', c))));
    }));
  }
  
  async bundleRequireImports() {
    return Promise.all(['modules', 'plugins'].map(async type => {
      const modulePaths = [];
      let modules = [];
      try {
        modules = await fs.readdir(path.resolve(this.srcDir, type));
      } catch(e) {} // folder doesn't exist, no problem

      await Promise.all(modules.map(async m => {
        try {
          const relPath = `${type}/${m}/index.js`;
          await fs.stat(path.resolve(this.srcDir, relPath));
          modulePaths.push(relPath);
        } catch(e) {}
      }));
      fs.writeFile(`${this.srcDir}/${type}-bundle.js`, `define(${JSON.stringify(modulePaths)}, function() {});`);
    }));
  }
  
  async copyAssets() {
    const outputDir = `${this.buildDir}/css/assets`;
    fs.mkdir(outputDir, { recursive: true });
    const assets = await this.getFiles('**/assets/**');
    return Promise.all(assets.map(a => fs.copyFile(a, `${outputDir}/${path.basename(a)}`)));
  }
 
  async copyHbs() {
    const files = ['index.hbs', 'loading.hbs'];
    return Promise.all(files.map(f => fs.copyFile(`${this.srcDir}/core/${f}`, `${this.buildDir}/${f}`)));
  }

  async compileLess() {
    const cssFilename = `${this.outputFileName}.css`;
    const cssPath = path.join(this.buildDir, 'css', cssFilename);
    const lessOptions = { 
      compress: this.isDev, 
      paths: `${this.srcDir}/core/less`
    };
    if(this.isDev) { // source maps
      lessOptions.sourceMap = {
        sourceMapFileInline: false,
        outputSourceFiles: true,
        sourceMapBasepath: 'src',
        sourceMapURL: `${cssFilename}.map`
      };
    }
    const lessImports = (await this.getFiles('**/*.less')).reduce((s,p) => `${s}@import '${p}';\n`, '');
    const { css, map } = await lessPromise(lessImports, lessOptions);
    const tasks = [fs.writeFile(cssPath, css)];
    if(map) {
      const sourceMapPath = `${cssPath}.map`;
      const importsPath = `${sourceMapPath}.imports`;
      tasks.push(
        fs.writeFile(sourceMapPath, map), 
        fs.writeFile(importsPath, lessImports)
      );
    }
    return Promise.all(tasks);
  }
  
  async compileHandlebars() {
    const extName = '.hbs';
    const results = await Promise.all((await this.getFiles(`**/*${extName}`)).map(async t => {
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
    return fs.writeFile(path.join(this.srcDir, 'templates.js'), output);
  }
  
  async runRequireJs() {
    return new Promise((resolve, reject) => {
      requirejs.optimize({
        baseUrl: this.srcDir,
        name: 'core/app',
        mainConfigFile: `${this.srcDir}/core/config.js`,
        out: this.outputJsPath,
        preserveLicenseComments: this.isDev,
      }, resolve, reject);
    });
  }
  
  async runBabel() {
    const opts = Object.assign({
      cwd: this.srcDir,
      presets: [['@babel/preset-env', { targets: { ie: '11' } }]],
      sourceType: 'script'
    }, this.isDev ? // add task-specific options
      { compact: false, retainLines: true } : 
      { comments: false, minified: true }
    );
    const { code } = await babel.transformFileAsync(this.outputJsPath, opts);
    return fs.writeFile(this.outputJsPath, code);
  }
  async getFiles(globPattern) {
    return globPromise(globPattern, { cwd: this.srcDir, nodir: true, absolute: true });
  }
  
  async run() {
    const forceRebuildFlag = App.instance.args['rebuild-ui'];
    const rebuildFileExists = await this.fs('access', this.rebuildFilePath);
    const buildExists = await this.fs('access', this.buildDir);
    const shouldRebuild = forceRebuildFlag || rebuildFileExists || !buildExists;
    if(!shouldRebuild) {
      return;
    }
    await this.initBuildFolder();
    await this.preBuildHook.invoke(this);
    try {
      await fs.mkdir(this.buildDir, { recursive: true });
      await Promise.all([
        this.copyPlugins(),
        this.bundleRequireImports(),
        this.copyAssets(),
        this.copyHbs(),
        this.compileLess(),
        this.compileHandlebars()
      ]);
      await this.runRequireJs();
      await this.runBabel();
      console.log(rebuildFileExists, this.rebuildFilePath);
      await this.fs('rm', this.rebuildFilePath);

      this.log('info', 'UI built successfully');

    } catch(e) {
      this.log('error', `failed to build UI, ${e}`);
    }
  }

  async log(...args) {
    const framework = await App.instance.waitForModule('adaptframework');
    framework.log(...args);
  }
}

export default UiBuild;