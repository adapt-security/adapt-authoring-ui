import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import os from 'node:os'
import path from 'node:path'
import fs from 'fs-extra'
import { rollup } from 'rollup'
import { babel } from '@rollup/plugin-babel'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import terser from '@rollup/plugin-terser'

/**
 * Integration smoke test for the Rollup build. Unlike the pure-utility specs,
 * this drives a real rollup() build through the same plugin stack and output
 * options that lib/JavaScriptTask.js uses, so a breaking Rollup major upgrade
 * (e.g. the v2 -> v4 jump) fails CI instead of silently shipping a broken
 * adapt.min.js. It exercises: the native v4 parser, commonjs/node-resolve/babel
 * plugin compatibility, the AMD output format and the interop/esModule pins.
 */
describe('JavaScriptTask rollup build (integration)', () => {
  let tmpDir
  let entry
  let out

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jstask-build-'))
    // a CommonJS dependency, to exercise @rollup/plugin-commonjs + interop
    fs.writeFileSync(path.join(tmpDir, 'cjsDep.js'), 'module.exports = { greet: name => "hi " + name }\n')
    // a JSX component, to exercise @babel/preset-react under the v4 plugin API
    fs.writeFileSync(path.join(tmpDir, 'widget.jsx'), 'export default () => <div className="widget">hello</div>\n')
    entry = path.join(tmpDir, 'entry.js')
    fs.writeFileSync(entry, [
      'import cjsDep from "./cjsDep.js"',
      'import Widget from "./widget.jsx"',
      'export default { greeting: cjsDep.greet("adapt"), Widget }'
    ].join('\n') + '\n')
    out = path.join(tmpDir, 'adapt.min.js')
  })

  after(() => {
    fs.removeSync(tmpDir)
  })

  it('bundles the plugin stack into a loadable AMD module with the v2-compatible output options', async () => {
    const bundle = await rollup({
      input: entry,
      shimMissingExports: true,
      plugins: [
        commonjs(),
        nodeResolve({ browser: true, preferBuiltins: false }),
        babel({
          babelHelpers: 'bundled',
          extensions: ['.js', '.jsx'],
          presets: [
            ['@babel/preset-react', { runtime: 'classic' }],
            ['@babel/preset-env', { useBuiltIns: false }]
          ]
        })
      ]
    })

    await bundle.write({
      file: out,
      format: 'amd',
      // these mirror the migration-sensitive pins in lib/JavaScriptTask.js
      interop: 'compat',
      esModule: true,
      plugins: [terser({ mangle: false, compress: false })],
      amd: { define: 'require' },
      footer: 'window.__AMD = function(id, value) { window.define(id, function() { return value; }); window.require([id]); return value; };',
      strict: true
    })
    await bundle.close()

    const code = fs.readFileSync(out, 'utf8')
    assert.ok(code.length > 0, 'bundle should not be empty')
    // amd.define: 'require' renames the AMD wrapper function from define to require
    assert.match(code, /require\(\[/)
    // esModule: true emits the interop marker for the default export
    assert.match(code, /__esModule/)
    // the custom footer must survive into the output
    assert.match(code, /window\.__AMD/)
  })
})
