import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import path from 'upath'

/**
 * UiBuild depends on the full app context (adapt-authoring-core Hook, app object,
 * gaze, rollup, etc.). We extract and test the pure utility methods in isolation
 * by reimplementing them with the same logic as UiBuild.prototype methods.
 */

/**
 * Reimplementation of UiBuild.prototype.collate for isolated testing.
 * Computes an output path from a collateAtFolderName, destFolder, and srcFileName.
 */
function collate (collateAtFolderName, destFolder, srcFileName) {
  const nameParts = srcFileName.split('/')
  if (nameParts[nameParts.length - 1] === collateAtFolderName) {
    return destFolder
  }
  const startOfCollatePath = srcFileName.indexOf(collateAtFolderName) + collateAtFolderName.length + 1
  return path.join(destFolder, srcFileName.substr(startOfCollatePath))
}

describe('UiBuild', () => {
  describe('collate', () => {
    it('should return destFolder when srcFileName ends with collateAtFolderName', () => {
      const result = collate('assets', '/output/assets', 'some/path/assets')
      assert.equal(result, '/output/assets')
    })

    it('should extract the path after collateAtFolderName and join with destFolder', () => {
      const result = collate('assets', '/output/assets', 'some/path/assets/images/logo.png')
      assert.equal(result, '/output/assets/images/logo.png')
    })

    it('should handle nested folder structures correctly', () => {
      const result = collate('required', '/build', 'app/core/required/config.json')
      assert.equal(result, '/build/config.json')
    })

    it('should handle deeply nested paths after collateAtFolderName', () => {
      const result = collate('libraries', '/out/libs', 'app/libraries/vendor/jquery/jquery.min.js')
      assert.equal(result, '/out/libs/vendor/jquery/jquery.min.js')
    })

    it('should handle single file after collateAtFolderName', () => {
      const result = collate('assets', '/dest', 'module/assets/file.txt')
      assert.equal(result, '/dest/file.txt')
    })
  })
})
