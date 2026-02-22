import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { collate } from '../lib/utils/collate.js'

describe('collate()', () => {
  it('should return destFolder when srcFileName ends with collateAtFolderName', () => {
    const result = collate('assets', '/output/css/assets', 'some/path/assets')
    assert.equal(result, '/output/css/assets')
  })

  it('should join destFolder with path after collateAtFolderName', () => {
    const result = collate('assets', '/output/css/assets', 'node_modules/plugin/assets/image.png')
    assert.equal(result, '/output/css/assets/image.png')
  })

  it('should handle nested paths after collateAtFolderName', () => {
    const result = collate('assets', '/output/css/assets', 'node_modules/plugin/assets/fonts/bold.woff')
    assert.equal(result, '/output/css/assets/fonts/bold.woff')
  })

  it('should handle libraries folder type', () => {
    const result = collate('libraries', '/output/libraries', 'node_modules/adapt-authoring-ui/app/libraries/jquery.js')
    assert.equal(result, '/output/libraries/jquery.js')
  })

  it('should handle required folder type', () => {
    const result = collate('required', '/output', 'node_modules/adapt-authoring-ui/app/core/required/config.json')
    assert.equal(result, '/output/config.json')
  })

  it('should handle srcFileName that exactly matches collateAtFolderName', () => {
    const result = collate('assets', '/dest', 'assets')
    assert.equal(result, '/dest')
  })

  it('should handle multiple occurrences of collateAtFolderName (uses first)', () => {
    const result = collate('assets', '/dest', 'path/assets/sub/assets/file.png')
    assert.equal(result, '/dest/sub/assets/file.png')
  })

  it('should handle paths with no content after collateAtFolderName marker', () => {
    const result = collate('assets', '/dest', 'some/path/assets/')
    // srcFileName ends with '/' not 'assets', so it enters the path calculation
    // indexOf('assets') + 'assets'.length + 1 = past the slash, substr returns empty string
    const expected = '/dest'
    assert.equal(result, expected)
  })

  it('should return a string', () => {
    const result = collate('assets', '/output', 'some/assets/file.txt')
    assert.equal(typeof result, 'string')
  })
})
