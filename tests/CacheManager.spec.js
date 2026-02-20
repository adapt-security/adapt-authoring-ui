import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'crypto'
import os from 'os'
import path from 'path'
import fs from 'fs-extra'
import CacheManager from '../lib/CacheManager.js'

describe('CacheManager', () => {
  describe('constructor', () => {
    it('should set maxAge to the provided value', () => {
      const cm = new CacheManager({ maxAge: 1000, logger: { log () {} } })
      assert.equal(cm.maxAge, 1000)
    })

    it('should use ONE_WEEK as default maxAge', () => {
      const ONE_WEEK = 7 * 24 * 60 * 60 * 1000
      const cm = new CacheManager({ logger: { log () {} } })
      assert.equal(cm.maxAge, ONE_WEEK)
    })

    it('should set the provided logger', () => {
      const logger = { log () {} }
      const cm = new CacheManager({ logger })
      assert.equal(cm.logger, logger)
    })

    it('should use a default logger when none is provided', () => {
      const cm = new CacheManager()
      assert.equal(typeof cm.logger.log, 'function')
    })

    it('should use provided tempDir', () => {
      const tempDir = path.join(os.tmpdir(), 'adapt-authoring-test-custom')
      const cm = new CacheManager({ tempDir, logger: { log () {} } })
      assert.equal(cm.tempDir, tempDir)
      // Cleanup
      try { fs.rmdirSync(tempDir) } catch (e) {}
    })

    it('should use default tempDir when none is provided', () => {
      const cm = new CacheManager({ logger: { log () {} } })
      assert.equal(cm.tempDir, path.join(os.tmpdir(), 'adapt-authoring'))
    })

    it('should ensure tempDir directory exists', () => {
      const cm = new CacheManager({ logger: { log () {} } })
      assert.ok(fs.existsSync(cm.tempDir))
    })
  })

  describe('static hash', () => {
    it('should return a SHA1 hex digest of the input', () => {
      const input = '/some/path/to/file'
      const expected = crypto
        .createHash('sha1')
        .update(input, 'utf8')
        .digest('hex')
      assert.equal(CacheManager.hash(input), expected)
    })

    it('should return different hashes for different inputs', () => {
      const hash1 = CacheManager.hash('/path/one')
      const hash2 = CacheManager.hash('/path/two')
      assert.notEqual(hash1, hash2)
    })

    it('should return the same hash for the same input', () => {
      const hash1 = CacheManager.hash('/same/path')
      const hash2 = CacheManager.hash('/same/path')
      assert.equal(hash1, hash2)
    })

    it('should return a 40-character hex string', () => {
      const hash = CacheManager.hash('test')
      assert.match(hash, /^[0-9a-f]{40}$/)
    })
  })

  describe('cachePath', () => {
    it('should return a .cache file path under tempDir', () => {
      const cm = new CacheManager({ logger: { log () {} } })
      const result = cm.cachePath('/base', '/output')
      assert.ok(result.startsWith(cm.tempDir))
      assert.ok(result.endsWith('.cache'))
    })

    it('should incorporate both basePath and outputFilePath into the hash', () => {
      const cm = new CacheManager({ logger: { log () {} } })
      const result1 = cm.cachePath('/base1', '/output')
      const result2 = cm.cachePath('/base2', '/output')
      assert.notEqual(result1, result2)
    })

    it('should use process.cwd() as default outputFilePath', () => {
      const cm = new CacheManager({ logger: { log () {} } })
      const expectedHash = CacheManager.hash(path.join('/base', process.cwd()))
      const expected = path.join(cm.tempDir, `${expectedHash}.cache`)
      assert.equal(cm.cachePath('/base'), expected)
    })

    it('should produce a deterministic result for same inputs', () => {
      const cm = new CacheManager({ logger: { log () {} } })
      const result1 = cm.cachePath('/base', '/output')
      const result2 = cm.cachePath('/base', '/output')
      assert.equal(result1, result2)
    })
  })

  describe('checkFilePath', () => {
    it('should return a last.touch file path under tempDir', () => {
      const cm = new CacheManager({ logger: { log () {} } })
      assert.equal(cm.checkFilePath, path.join(cm.tempDir, 'last.touch'))
    })
  })

  describe('isCleaningTime', () => {
    let cm

    beforeEach(() => {
      cm = new CacheManager({ maxAge: 1000, logger: { log () {} } })
    })

    it('should return true when checkFile does not exist', async () => {
      const checkPath = cm.checkFilePath
      try { fs.unlinkSync(checkPath) } catch (e) {}
      const result = await cm.isCleaningTime()
      assert.equal(result, true)
    })

    it('should return false when checkFile was just created', async () => {
      const checkPath = cm.checkFilePath
      fs.writeFileSync(checkPath, String(Date.now()))
      const result = await cm.isCleaningTime()
      assert.equal(result, false)
    })
  })

  describe('clean', () => {
    let cm

    beforeEach(() => {
      // Use a large maxAge so the checkFile is not treated as expired
      cm = new CacheManager({ maxAge: 7 * 24 * 60 * 60 * 1000, logger: { log () {} } })
      fs.ensureDirSync(cm.tempDir)
      // Remove checkFile to ensure cleaning happens
      try { fs.unlinkSync(cm.checkFilePath) } catch (e) {}
    })

    it('should create checkFile after cleaning', async () => {
      await cm.clean()
      assert.ok(fs.existsSync(cm.checkFilePath))
    })

    it('should not clean when it is not cleaning time', async () => {
      // First write the checkFile so it appears fresh
      fs.writeFileSync(cm.checkFilePath, String(Date.now()))
      // Set a long maxAge so checkInterval is large
      cm.maxAge = 7 * 24 * 60 * 60 * 1000
      // Create a test file
      const testFile = path.join(cm.tempDir, 'test-no-clean.cache')
      fs.writeFileSync(testFile, 'data')
      await cm.clean()
      // File should still exist since it is not cleaning time
      assert.ok(fs.existsSync(testFile))
      // Cleanup
      try { fs.unlinkSync(testFile) } catch (e) {}
    })
  })
})
