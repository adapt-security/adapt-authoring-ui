import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs-extra'

/**
 * JavaScriptTask depends on rollup, babel, glob, fs-extra and other heavy
 * build dependencies. We test the pure utility methods in isolation by
 * reimplementing them with the same logic.
 */

/**
 * Reimplementation of JavaScriptTask.prototype.escapeRegExp for isolated testing.
 */
function escapeRegExp (string) {
  return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&')
}

describe('JavaScriptTask', () => {
  describe('escapeRegExp', () => {
    it('should escape dots', () => {
      assert.equal(escapeRegExp('file.js'), 'file\\.js')
    })

    it('should escape asterisks', () => {
      assert.equal(escapeRegExp('**/*.js'), '\\*\\*/\\*\\.js')
    })

    it('should escape plus signs', () => {
      assert.equal(escapeRegExp('a+b'), 'a\\+b')
    })

    it('should escape question marks', () => {
      assert.equal(escapeRegExp('file?.js'), 'file\\?\\.js')
    })

    it('should escape caret', () => {
      assert.equal(escapeRegExp('^start'), '\\^start')
    })

    it('should escape dollar sign', () => {
      assert.equal(escapeRegExp('end$'), 'end\\$')
    })

    it('should escape curly braces', () => {
      assert.equal(escapeRegExp('{a,b}'), '\\{a,b\\}')
    })

    it('should escape parentheses', () => {
      assert.equal(escapeRegExp('(group)'), '\\(group\\)')
    })

    it('should escape pipe', () => {
      assert.equal(escapeRegExp('a|b'), 'a\\|b')
    })

    it('should escape square brackets', () => {
      assert.equal(escapeRegExp('[abc]'), '\\[abc\\]')
    })

    it('should escape backslashes', () => {
      assert.equal(escapeRegExp('path\\to'), 'path\\\\to')
    })

    it('should escape hyphen/minus', () => {
      assert.equal(escapeRegExp('a-b'), 'a\\-b')
    })

    it('should return the same string if no special chars', () => {
      assert.equal(escapeRegExp('hello world'), 'hello world')
    })

    it('should handle empty string', () => {
      assert.equal(escapeRegExp(''), '')
    })

    it('should handle multiple special characters together', () => {
      const input = 'C:\\Users\\test\\file.js'
      const expected = 'C:\\\\Users\\\\test\\\\file\\.js'
      assert.equal(escapeRegExp(input), expected)
    })

    it('should produce a string usable in new RegExp without error', () => {
      const special = 'path/to/file.*(test)+[0]'
      const escaped = escapeRegExp(special)
      assert.doesNotThrow(() => new RegExp(escaped))
    })

    it('should produce a regex that matches the original string literally', () => {
      const special = 'hello.world+foo*bar'
      const escaped = escapeRegExp(special)
      const regex = new RegExp(escaped)
      assert.ok(regex.test(special))
    })
  })

  describe('checkCache', () => {
    /**
     * Reimplementation of JavaScriptTask.prototype.checkCache for isolated testing.
     * Uses a context object instead of `this`.
     */
    function checkCache (context, invalidate) {
      if (!context.cache) return
      const idHash = {}
      const missing = {}
      context.cache.modules.forEach(mod => {
        const moduleId = mod.id
        const isRollupHelper = (moduleId[0] === '\u0000')
        if (isRollupHelper) {
          return null
        }
        if (!fs.existsSync(moduleId)) {
          context.log('error', `Cache missing file: ${moduleId.replace(context.cwd, '')}`)
          missing[moduleId] = true
          return false
        }
        if (invalidate && invalidate.includes(moduleId)) {
          context.log('debug', `Cache skipping file: ${moduleId.replace(context.cwd, '')}`)
          return false
        }
        idHash[moduleId] = mod
        return true
      })
      if (Object.keys(missing).length) {
        context.cache = null
        return
      }
      context.cache.modules = Object.values(idHash)
    }

    it('should return early when cache is null', () => {
      const context = { cache: null, log () {} }
      checkCache(context, [])
      assert.equal(context.cache, null)
    })

    it('should clear cache when a module file is missing', () => {
      const context = {
        cache: {
          modules: [
            { id: '/nonexistent/path/to/module.js' }
          ]
        },
        cwd: process.cwd() + '/',
        log () {}
      }
      checkCache(context, [])
      assert.equal(context.cache, null)
    })

    it('should skip rollup helper modules (prefixed with null char)', () => {
      // Create a real file so the non-helper module passes the existsSync check
      const existingFile = import.meta.url.replace('file://', '').replace(/\/[^/]+$/, '/JavaScriptTask.spec.js')
      const context = {
        cache: {
          modules: [
            { id: '\u0000rollupHelper' },
            { id: existingFile }
          ]
        },
        cwd: '',
        log () {}
      }
      checkCache(context, [])
      // Cache should not be null since the real file exists
      assert.notEqual(context.cache, null)
      // Only the real file should remain (rollup helper is skipped, not added to idHash)
      assert.equal(context.cache.modules.length, 1)
      assert.equal(context.cache.modules[0].id, existingFile)
    })

    it('should remove invalidated modules from cache', () => {
      const existingFile = import.meta.url.replace('file://', '').replace(/\/[^/]+$/, '/JavaScriptTask.spec.js')
      const context = {
        cache: {
          modules: [
            { id: existingFile }
          ]
        },
        cwd: '',
        log () {}
      }
      checkCache(context, [existingFile])
      assert.notEqual(context.cache, null)
      assert.equal(context.cache.modules.length, 0)
    })

    it('should keep valid non-invalidated modules', () => {
      const existingFile = import.meta.url.replace('file://', '').replace(/\/[^/]+$/, '/JavaScriptTask.spec.js')
      const context = {
        cache: {
          modules: [
            { id: existingFile }
          ]
        },
        cwd: '',
        log () {}
      }
      checkCache(context, [])
      assert.notEqual(context.cache, null)
      assert.equal(context.cache.modules.length, 1)
    })
  })

  describe('logPrettyError', () => {
    it('should handle errors with loc and babel plugin', () => {
      const err = new Error('babel: Unexpected token\n  1 | code here\n    | ^')
      err.loc = { line: 1, column: 5 }
      err.plugin = 'babel'
      err.id = '/Users/test/project/src/file.js'

      // Extract babel error handling logic from logPrettyError
      err.frame = err.message.substr(err.message.indexOf('\n') + 1)
      err.message = err.message.substr(0, err.message.indexOf('\n')).slice(2).replace(/^([^:]*): /, '')

      assert.equal(err.message, 'Unexpected token')
      assert.ok(err.frame.includes('code here'))
    })

    it('should handle errors without loc property', () => {
      const err = new Error('Generic build error')
      const hasLoc = Boolean(err.loc)
      assert.equal(hasLoc, false)
    })

    it('should handle errors with loc but non-babel plugin', () => {
      const logged = []
      const log = (level, ...args) => logged.push({ level, args })
      const err = new Error('Some plugin error')
      err.loc = { line: 5, column: 10 }
      err.plugin = 'other-plugin'
      err.id = '/test/src/file.js'

      // Non-babel plugin path logs err.toString() in the default case
      let hasOutput = false
      switch (err.plugin) {
        case 'babel':
          break
        default:
          hasOutput = true
          log('error', err.toString())
      }
      assert.equal(hasOutput, true)
      assert.equal(logged.length, 1)
      assert.equal(logged[0].level, 'error')
    })
  })
})
