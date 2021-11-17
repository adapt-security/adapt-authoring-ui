const babel = require("@babel/core");
const fs = require('fs/promises');
const handlebars = require('handlebars');
const path = require('path');
const { promisify } = require('util');
const requirejs = require('requirejs');

const globPromise = promisify(require('glob'));
const lessPromise = promisify(require('less').render);

class UIBuild {
  constructor({ isDev, srcDir, buildDir }) {
    this.isDev = isDev;
    this.srcDir = srcDir;
    this.buildDir = buildDir;
    this.outputFileName = 'adapt';
    this.outputJsPath = `${this.buildDir}/js/${this.outputFileName}.js`;
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
    await fs.rm(this.buildDir, { recursive: true });
    await Promise.all([
      this.bundleRequireImports(),
      this.copyAssets(),
      this.compileLess(),
      this.compileHandlebars()
    ]);
    await this.runRequireJs();
    await this.runBabel();
  }
}

module.exports = UIBuild;