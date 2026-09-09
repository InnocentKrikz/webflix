import test from 'node:test'
import assert from 'node:assert/strict'
import { withFallbackDominantColors } from '../lib/title-colors.ts'

const title = (colors) => ({
  id: 'movie-1',
  dominantColor1: colors[0],
  dominantColor2: colors[1],
  dominantColor3: colors[2],
})

test('duplicate title payloads retain stored dominant colours', () => {
  const featured = title([null, null, null])
  const stored = title(['#AA0000', '#0011AA', '#111111'])

  assert.deepEqual(withFallbackDominantColors(featured, stored), stored)
  assert.deepEqual(withFallbackDominantColors(stored, featured), stored)
})

test('partial palettes keep preferred colours and fill only missing values', () => {
  assert.deepEqual(
    withFallbackDominantColors(
      title(['#AA0000', null, '#111111']),
      title(['#FF0000', '#0011AA', '#222222']),
    ),
    title(['#AA0000', '#0011AA', '#111111']),
  )
})
