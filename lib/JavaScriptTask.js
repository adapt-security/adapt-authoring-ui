import CacheManager from './CacheManager.js';
import path from 'upath';
import fs from 'fs-extra';
import { rollup } from 'rollup';
import { babel } from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import resolve from 'resolve';
import terser from '@rollup/plugin-terser';
import injectProcessEnv from 'rollup-plugin-inject-process-env';
import MagicString from 'magic-string';
import { deflate, unzip, constants } from 'zlib';
import { globbySync } from 'globby';
import _ from 'lodash';

let log;

export default class JavaScriptTask {

  constructor(_log, buildDir) {
    log = _log;
    this.convertSlashes = /\\/g;
    this.cwd = process.cwd().replace(this.convertSlashes, '/') + '/';
    this.isDisableCache = process.argv.includes('--disable-cache');
    this.isFirstRun = true;
    this.cache = null;
    this.extensions = ['.js', '.jsx'];
    this.cacheManager = new CacheManager();
    this.resolvedNodeModules = {};
    this.resolvedNodeModulesPaths = [];

    this.buildConfig = {
    };

    const packagesWithUiPlugin = globbySync('node_modules/adapt-authoring-*/ui-plugin', {onlyDirectories: true})
    const packageJsons = globbySync(packagesWithUiPlugin.map(p => path.join(path.dirname(p), 'package.json')))
    const uiPluginDeps = packageJsons.reduce((arr, p) => {
      const packageJson = fs.readJSONSync(p);
      if (!packageJson.dependencies) return arr
      return arr.concat(Object.keys(packageJson.dependencies))
    }, [])

    this.options = {
      generateSourceMaps:true,
      baseUrl:'node_modules/',
      name: 'adapt-authoring-ui/app/core/app',
      out: path.join(buildDir, 'js', 'adapt.min.js'),
      modulesGlob:'node_modules/adapt-authoring-ui/app/modules/*/index.js',
      pluginsGlob:'node_modules/adapt-authoring-*/ui-plugin/*/index.js',
      pluginsOrder:files=>files,
      external: {
        jquery: 'empty:',
        underscore: 'empty:',
        backbone: 'empty:',
        modernizr: 'empty:',
        handlebars: 'empty:',
        imageReady: 'empty:',
        inview: 'empty:',
        scrollTo: 'empty:',
        libraries: 'empty:',
        bowser: 'empty:',
        react: 'empty:',
        'react-dom': 'empty:',
        'object.assign': 'empty:',
        'moment': 'empty:',
        'polyglot': 'empty:',
        ...(uiPluginDeps.reduce((obj, d) => (obj[d] = 'node_modules:', obj), {}))
      },
      externalMap:{},
      map:{
        "core": "adapt-authoring-ui/app/core",
        "modules": "adapt-authoring-ui/app/modules"
      }
    }
    log('debug', 'UI cache disabled with --disable-cache');
  }

  escapeRegExp(string) {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  }

  async restoreCache(cachePath, basePath) {
    if (this.isFirstRun || this.isDisableCache || this.cache || !fs.existsSync(cachePath)) return;
    await new Promise((resolve, reject) => {
      const buffer = fs.readFileSync(cachePath);
      unzip(buffer, (err, buffer) => {
        if (err) {
          log('error', 'An error occurred restoring rollup cache:', err);
          process.exitCode = 1;
          reject(err);
          return;
        }
        let str = buffer.toString();
        // Restore cache to current basePath
        str = str.replace(/%%basePath%%/g, basePath);
        this.cache = JSON.parse(str);
        resolve();
      });
    });
  }

  checkCache(invalidate) {
    if (!this.cache) return;
    const idHash = {};
    const missing = {};
    this.cache.modules.forEach(mod => {
      const moduleId = mod.id;
      const isRollupHelper = (moduleId[0] === '\u0000');
      if (isRollupHelper) {
        // Ignore as injected rollup module
        return null;
      }
      if (!fs.existsSync(moduleId)) {
        log('error', `Cache missing file: ${moduleId.replace(this.cwd, '')}`);
        missing[moduleId] = true;
        return false;
      }
      if (invalidate && invalidate.includes(moduleId)) {
        log('verbose', `Cache skipping file: ${moduleId.replace(this.cwd, '')}`);
        return false;
      }
      idHash[moduleId] = mod;
      return true;
    });
    if (Object.keys(missing).length) {
      this.cache = null;
      return;
    }
    this.cache.modules = Object.values(idHash);
  }

  async saveCache(cachePath, basePath, bundleCache) {
    if (!this.isDisableCache) {
      this.cache = bundleCache;
    }
    await new Promise((resolve, reject) => {
      let str = JSON.stringify(bundleCache);
      // Make cache location agnostic by stripping current basePath
      str = str.replace(new RegExp(this.escapeRegExp(basePath), 'g'), '%%basePath%%');
      deflate(str, { level: constants.Z_BEST_SPEED }, (err, buffer) => {
        if (err) {
          log('error', 'An error occurred saving rollup cache:', err);
          process.exitCode = 1;
          reject(err);
          return;
        }
        fs.writeFileSync(cachePath, buffer);
        resolve();
      });
    });
  }

  findNodeModule = (cwd, baseUrl, moduleId) => {
    if (this.resolvedNodeModules[moduleId]) return this.resolvedNodeModules[moduleId];
    const resolved = this.resolvedNodeModules[moduleId] = resolve.sync(moduleId, { basedir: path.resolve(cwd, baseUrl) });
    if (Boolean(resolved)) this.resolvedNodeModulesPaths.push(path.normalize(resolved));
    return resolved;
  }

  logPrettyError(err, cachePath, basePath) {
    let hasOutput = false;
    if (err.loc) {
      // Code error
      switch (err.plugin) {
        case 'babel':
          err.frame = err.message.substr(err.message.indexOf('\n') + 1);
          err.message = err.message.substr(0, err.message.indexOf('\n')).slice(2).replace(/^([^:]*): /, '');
          break;
        default:
          hasOutput = true;
          log('error', err.toString());
      }
      if (!hasOutput) {
        log('error', err.toString());
        log('error', `Line: ${err.loc.line}, Col: ${err.loc.column}, File: ${err.id.replace(this.cwd, '')}`);
        log('error', err.frame);
        hasOutput = true;
      }
    }
    if (!hasOutput) {
      this.cache = null;
      this.saveCache(cachePath, basePath, this.cache);
      console.error(err.toString());
    }
  }

  async run() {
    const options = this.options;
    const cwd = this.cwd;
    const extensions = this.extensions;
    const convertSlashes = this.convertSlashes;
    const cachePath = this.buildConfig.cachepath ?? this.cacheManager.cachePath(cwd, options.out);
    const isSourceMapped = Boolean(options.generateSourceMaps);
    const basePath = path.resolve(cwd + '/' + options.baseUrl).replace(this.convertSlashes, '/') + '/';
    const findNodeModule = this.findNodeModule;
    const resolvedNodeModulesPaths = this.resolvedNodeModulesPaths;
    let resolveCount = 0;

    const pluginsObject = {}

    const modules = globbySync(this.options.modulesGlob).map(entry => {
      return {
        "name": path.basename(path.dirname(entry)),
        "main": path.basename(entry),
        "sourcePath": path.dirname(entry)
      }
    });

    const plugins = globbySync(this.options.pluginsGlob).map(entry => {
      return {
        "name": path.basename(path.dirname(entry)),
        "main": path.basename(entry),
        "sourcePath": path.dirname(entry)
      }
    });

    pluginsObject.plugins = modules.concat(plugins);

    try {
      await this.restoreCache(cachePath, basePath);
      await this.cacheManager.clean();

      this.isFirstRun = false;

      // Collect all plugin entry points for injection
      const pluginPaths = options.pluginsOrder(pluginsObject.plugins.map(plugin => {
        if (plugin.name === 'adapt-contrib-core') return null;
        const requireJSRootPath = plugin.sourcePath.substr(options.baseUrl.length);
        const requireJSMainPath = path.join(requireJSRootPath, plugin.main);
        const ext = path.extname(requireJSMainPath);
        const requireJSMainPathNoExt = requireJSMainPath.slice(0, -ext.length).replace(convertSlashes, '/');
        return requireJSMainPathNoExt;
      }).filter(Boolean));

      // Process remapping and external model configurations
      const mapParts = Object.keys(options.map);
      const externalParts = Object.keys(options.external);
      const externalMap = options.externalMap;

      const findFile = function(filename) {
        filename = filename.replace(convertSlashes, '/');
        const hasValidExtension = extensions.includes(path.parse(filename).ext);
        if (!hasValidExtension) {
          const ext = extensions.find(ext => fs.existsSync(filename + ext)) || '';
          filename += ext;
        }
        return filename;
      };

      // Rework modules names and inject plugins
      const adaptLoader = function() {
        return {

          name: 'adaptLoader',

          resolveId(moduleId, parentId, opts) {
            const isRollupHelper = (moduleId[0] === '\u0000');
            if (isRollupHelper) {
              // Ignore as injected rollup module
              return null;
            }
            resolveCount++;
            const mapPart = mapParts.find(part => moduleId.startsWith(part));
            if (mapPart) {
              // Remap module, usually coreJS/adapt to core/js/adapt etc
              moduleId = moduleId.replace(mapPart, options.map[mapPart]);
            }
            // Remap ../libraries/ or core/js/libraries/ to libraries/
            moduleId = Object.entries(externalMap).reduce((moduleId, [ match, replaceWith ]) => moduleId.replace((new RegExp(match, 'g')), replaceWith), moduleId);
            const isRelative = (moduleId[0] === '.');
            // look for a complete match first
            let externalPart = externalParts.find(part => moduleId === part);
            // if no complete match look for prefix
            if (!externalPart) {
              externalPart = externalParts.find(part => moduleId.startsWith(part));
            }
            // has the module already been resolved by node-resolve?
            const isNodeResolved = Boolean(opts?.custom?.['node-resolve']);
            // has the module been imported by another node module?
            const isImportedByNodeModule = resolvedNodeModulesPaths.includes(parentId);
            // is the module an external library?
            const isExternal = Boolean(options.external[externalPart]);
            // is the module flagged as being a node module?
            const isNodeModule = Boolean(options.external[externalPart] === 'node_modules:');
            
            if (!isNodeResolved && !isNodeModule && !isImportedByNodeModule && isExternal) {
              // External module as defined in paths
              return {
                id: moduleId,
                external: true
              };
            }
            try {
              // Resolve node modules
              if (
                  isNodeResolved ||
                  isImportedByNodeModule ||
                  !moduleId.includes('adapt-') && findNodeModule(cwd, options.baseUrl, moduleId)
                ) {
                return null;
              }
            } catch (err) {}
            if (isRelative) {
              if (!parentId) {
                // Rework app.js path so that it can be made basePath agnostic in the cache
                const filename = findFile(path.resolve(moduleId));
                return {
                  id: filename,
                  external: false
                };
              }
              // Rework relative paths into absolute ones
              const filename = findFile(path.resolve(parentId + '/../' + moduleId));
              return {
                id: filename,
                external: false
              };
            }
            const isES6Import = !fs.existsSync(moduleId);
            if (isES6Import) {
              // ES6 imports start inside ./src so need correcting
              const filename = findFile(path.resolve(cwd, options.baseUrl, moduleId));
              return {
                id: filename,
                external: false
              };
            }
            // Normalize all other absolute paths as conflicting slashes will load twice
            const filename = findFile(path.resolve(cwd, moduleId));
            return {
              id: filename,
              external: false
            };
          }

        };
      };

      const adaptInjectPlugins = function() {
        return {

          name: 'adaptInjectPlugins',

          transform(code, moduleId) {
            const isRollupHelper = (moduleId[0] === '\u0000');
            if (isRollupHelper) {
              return null;
            }
            const isStart = (moduleId.includes('/' + options.baseUrl + options.name));
            if (!isStart) {
              return null;
            }

            const magicString = new MagicString(code);
            const matches = [...String(code).matchAll(/import .*;/g)];
            const last = matches[matches.length - 1];
            const end = last.index + last[0].length;

            const original = code.substr(0, end);
            const newPart = `\n${pluginPaths.map(filename => {
              return `import '${filename}';\n`;
            }).join('')}`;

            magicString.remove(0, end);
            magicString.prepend(original + newPart);

            return {
              code: magicString.toString(),
              map: isSourceMapped
                ? magicString.generateMap({
                  filename: moduleId,
                  includeContent: true
                })
                : false
            };
          }

        };
      };

      const targets = this.buildConfig.targets || null;
      log('verbose', `Targets: ${targets || fs.readFileSync('.browserslistrc').toString().replace(/#+[^\n]+\n/gm, '').replace(/\r/g, '').split('\n').filter(Boolean).join(', ')}`);

      const inputOptions = {
        input: './' + options.baseUrl + options.name,
        shimMissingExports: true,
        plugins: [
          adaptLoader({}),
          adaptInjectPlugins({}),
          commonjs({
            include: ['node_modules/**/*'],
            exclude: ['**/node_modules/adapt-*/**']
          }),
          injectProcessEnv({ 
            NODE_ENV: isSourceMapped ? 'development' : 'production'
          }),
          nodeResolve({
            browser: true,
            preferBuiltins: false
          }),
          babel({
            babelHelpers: 'bundled',
            extensions,
            minified: false,
            compact: false,
            comments: false,
            exclude: [ '**/node_modules/core-js/**' ],
            presets: [
              [
                '@babel/preset-react',
                {
                  runtime: 'classic'
                }
              ],
              [
                '@babel/preset-env',
                {
                  useBuiltIns: 'entry',
                  corejs: 3,
                  exclude: [
                    // Breaks lockingModel.js, set function vs set variable
                    'transform-function-name'
                  ],
                  targets
                }
              ]
            ],
            plugins: [
              [
                'transform-amd-to-es6',
                {
                  umdToAMDModules: true,
                  amdToES6Modules: true,
                  amdDefineES6Modules: true,
                  ignoreNestedRequires: true,
                  defineFunctionName: '__AMD',
                  defineModuleId: (moduleId) => {
                    const ext = path.extname(moduleId);
                    return moduleId.slice(0, -ext.length).replace(convertSlashes, '/').replace(basePath, '')
                  }
                }
              ]
            ]
          })
        ]
      };

      const umdImport = () => {
        return options.umdImports.map(filename => {
          let code = fs.readFileSync(filename).toString();
          code = code
            .replace('require("object-assign")', 'Object.assign')
            .replace('define.amd', 'define.noop');
          return code;
        }).join('\n');
      };

      const outputOptions = {
        file: options.out,
        format: 'amd',
        plugins: [
          !isSourceMapped && terser({
            mangle: false,
            compress: false
          })
        ].filter(Boolean),
        footer: `// Allow ES export default to be exported as amd modules
window.__AMD = function(id, value) {
  window.define(id, function() { return value; }); // define for external use
  window.require([id]); // force module to load
  return value; // return for export
};`,
        sourcemap: isSourceMapped,
        sourcemapPathTransform: (relativeSourcePath) => {
          // Rework sourcemap paths to overlay at the appropriate root
          return relativeSourcePath.replace(convertSlashes, '/').replace('../' + options.baseUrl, '');
        },
        amd: {
          define: 'require'
        },
        strict: true
      };

      this.checkCache([]);
      inputOptions.cache = this.cache;
      const bundle = await rollup(inputOptions);
      await this.saveCache(cachePath, basePath, bundle.cache);
      await bundle.write(outputOptions);

      log('debug', 'Using the following Node modules:', Object.keys(this.resolvedNodeModules));
      log('info', 'JavaScriptTask: resolved', resolveCount, 'IDs');
      

      // Remove old sourcemap if no longer required
      if (!isSourceMapped && fs.existsSync(options.out + '.map')) {
        fs.unlinkSync(options.out + '.map');
      }
    } catch (err) {
      this.logPrettyError(err, cachePath, basePath);
    }
  }
}
