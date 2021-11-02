const babel = require("@babel/core");
const fs = require('fs');
const handlebars = require('handlebars');
const path = require('path');
const { promisify } = require('util');
const requirejs = require('requirejs');

const globPromise = promisify(require('glob'));
const lessPromise = promisify(require('less').render);

class UIBuild {
  constructor() {
    this.isDev = process.argv[2] === 'dev';
    this.baseDir = path.resolve(__dirname, 'app');
    this.outputDir = path.resolve('dist');
    this.outputFileName = 'adapt';
    this.outputJsPath = `${this.outputDir}/js/${this.outputFileName}.js`;
  }
  
  async bundleRequireImports() {
    return Promise.all(['modules', 'plugins'].map(async type => {
      const modulePaths = [];
      const modules = await fs.promises.readdir(path.resolve(this.baseDir, type));
      await Promise.all(modules.map(async m => {
        try {
          const relPath = `${type}/${m}/index.js`;
          await fs.promises.stat(path.resolve(this.baseDir, relPath));
          modulePaths.push(relPath);
        } catch(e) {}
      }));
      fs.promises.writeFile(path.resolve(this.baseDir, type, `${type}.js`), `define(${JSON.stringify(modulePaths)}, function() {});`);
    }));
  }
  
  async copyAssets() {
    const outputDir = `${this.outputDir}/css/assets`;
    fs.promises.mkdir(outputDir, { recursive: true });
    const assets = await this.getFiles('**/assets/**');
    return Promise.all(assets.map(a => fs.promises.copyFile(a, `${outputDir}/${path.basename(a)}`)));
  }

  async compileLess() {
    const cssFilename = `${this.outputFileName}.css`;
    const cssPath = path.join(this.outputDir, 'css', cssFilename);
    const lessOptions = { 
      compress: this.isDev, 
      paths: 'app/core/less' 
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
    const tasks = [fs.promises.writeFile(cssPath, css)];
    if(map) {
      const sourceMapPath = `${cssPath}.map`;
      const importsPath = `${sourceMapPath}.imports`;
      tasks.push(
        fs.promises.writeFile(sourceMapPath, map), 
        fs.promises.writeFile(importsPath, lessImports)
      );
    }
    return Promise.all(tasks);
  }
  
  async compileHandlebars() {
    const extName = '.hbs';
    const results = await Promise.all((await this.getFiles(`**/*${extName}`)).map(async t => {
      const compiled = handlebars.precompile((await fs.promises.readFile(t)).toString());
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
    return fs.promises.writeFile(path.join(this.baseDir, 'templates', 'templates.js'), output);
  }
  
  async runRequireJs() {
    return new Promise((resolve, reject) => {
      requirejs.optimize({
        baseUrl: this.baseDir,
        name: 'core/app',
        mainConfigFile: 'app/core/config.js',
        out: this.outputJsPath,
        preserveLicenseComments: this.isDev
      }, resolve, reject);
    });
  }
  
  async runBabel() {
    const opts = {
      cwd: this.baseDir,
      presets: [ [ '@babel/preset-env', { targets: { ie: '11' } } ] ],	
      sourceType: 'script'
    };
    Object.assign(opts, this.isDev ? // add task-specific options
      { compact: false, retainLines: true } : 
      { comments: false, minified: true }
    );
    const { code } = await babel.transformFileAsync(this.outputJsPath, opts);
    return fs.promises.writeFile(this.outputJsPath, code);
  }
  async getFiles(globPattern) {
    return globPromise(globPattern, { cwd: this.baseDir, nodir: true, absolute: true });
  }
  
  async run() {
    try {
      await fs.promises.rmdir(this.outputDir, { recursive: true });
      await this.bundleRequireImports();
      await this.copyAssets();
      await this.compileLess();
      await this.compileHandlebars();
      await this.runRequireJs();
      await this.runBabel();
    } catch(e) {
      console.log('ERROR!', e);
    }
  }
}

module.exports = UIBuild;