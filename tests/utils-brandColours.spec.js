import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { brandColours } from '../lib/utils/brandColours.js'

describe('brandColours()', () => {
  const cases = [
    {
      name: 'maps each core colour onto its LESS variable',
      input: { primaryColour: '#1ec0d9', commitColour: '#00dd95', chromeColour: '#263944', accentColour: '#ec4899' },
      expected: { '@primary-color': '#1ec0d9', '@secondary-color': '#00dd95', '@tertiary-color': '#263944', '@quaternary-color': '#ec4899' }
    },
    {
      name: 'omits colours that are unset',
      input: { primaryColour: '#1ec0d9' },
      expected: { '@primary-color': '#1ec0d9' }
    },
    {
      name: 'omits empty-string colours',
      input: { primaryColour: '', accentColour: '#ec4899' },
      expected: { '@quaternary-color': '#ec4899' }
    },
    { name: 'returns an empty map for no colours', input: {}, expected: {} },
    { name: 'returns an empty map for no argument', input: undefined, expected: {} }
  ]

  cases.forEach(({ name, input, expected }) => {
    it(name, () => {
      assert.deepEqual(brandColours(input), expected)
    })
  })

  it('ignores unknown keys', () => {
    assert.deepEqual(brandColours({ someOtherColour: '#fff' }), {})
  })
})
