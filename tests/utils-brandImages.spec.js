import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { brandImages } from '../lib/utils/brandImages.js'

describe('brandImages()', () => {
  const assetsDir = '/build/css/assets'

  const cases = [
    {
      name: 'maps each configured image to its dest and served URL',
      input: {
        favicon: '/etc/brand/icon.svg',
        logo: '/etc/brand/mark.png',
        loginBackground: '/etc/brand/bg.jpg',
        projectPlaceholder: '/etc/brand/tile.png'
      },
      expected: {
        favicon: { src: '/etc/brand/icon.svg', dest: '/build/css/assets/brand-favicon.svg', url: '/css/assets/brand-favicon.svg' },
        logo: { src: '/etc/brand/mark.png', dest: '/build/css/assets/brand-logo.png', url: '/css/assets/brand-logo.png' },
        loginBackground: { src: '/etc/brand/bg.jpg', dest: '/build/css/assets/brand-login-background.jpg', url: '/css/assets/brand-login-background.jpg' },
        projectPlaceholder: { src: '/etc/brand/tile.png', dest: '/build/css/assets/brand-project-placeholder.png', url: '/css/assets/brand-project-placeholder.png' }
      }
    },
    {
      name: 'omits images that are unset',
      input: { logo: '/etc/brand/mark.png' },
      expected: { logo: { src: '/etc/brand/mark.png', dest: '/build/css/assets/brand-logo.png', url: '/css/assets/brand-logo.png' } }
    },
    {
      name: 'omits empty-string images',
      input: { favicon: '', logo: '/etc/brand/mark.svg' },
      expected: { logo: { src: '/etc/brand/mark.svg', dest: '/build/css/assets/brand-logo.svg', url: '/css/assets/brand-logo.svg' } }
    },
    { name: 'returns an empty map for no images', input: {}, expected: {} },
    { name: 'returns an empty map for no argument', input: undefined, expected: {} }
  ]

  cases.forEach(({ name, input, expected }) => {
    it(name, () => {
      assert.deepEqual(brandImages(input, assetsDir), expected)
    })
  })

  it('honours a custom served base', () => {
    assert.deepEqual(
      brandImages({ favicon: '/x/icon.ico' }, '/out/assets', '/static'),
      { favicon: { src: '/x/icon.ico', dest: '/out/assets/brand-favicon.ico', url: '/static/brand-favicon.ico' } }
    )
  })

  it('ignores unknown keys', () => {
    assert.deepEqual(brandImages({ someOtherImage: '/x/y.png' }, assetsDir), {})
  })
})
