import test from 'node:test'
import assert from 'node:assert/strict'
import { withFallbackTrailerTimelines, selectShowcaseTrailer } from '../lib/title-trailers.ts'

const timeline = [{ timestamp: 0, average: '#123456' }, { timestamp: 4, average: '#abcdef' }]
const video = (videoKey, samples = []) => ({ id: videoKey, videoKey, timeline: samples })
const title = (trailers) => ({ id: 'movie-1', trailers })

test('duplicate card and upcoming payloads preserve the same video timeline in either order', () => {
  const card = title([video('abcdefghijk')])
  const upcoming = title([video('abcdefghijk', timeline)])
  assert.deepEqual(withFallbackTrailerTimelines(card, upcoming), upcoming)
  assert.equal(withFallbackTrailerTimelines(upcoming, card), upcoming)
})

test('samples stay attached to their YouTube video, including videos omitted from compact lists', () => {
  const merged = withFallbackTrailerTimelines(
    title([video('newestpromo')]), title([video('oldtrailer1', timeline)]),
  )
  assert.deepEqual(merged.trailers[0].timeline, [])
  assert.equal(selectShowcaseTrailer(merged.trailers).videoKey, 'oldtrailer1')
  assert.equal(selectShowcaseTrailer(merged.trailers).timeline, timeline)
})

test('trailers remain playable while analysis is pending, and empty collections are safe', () => {
  const pending = video('abcdefghijk')
  assert.equal(selectShowcaseTrailer([pending]), pending)
  assert.equal(selectShowcaseTrailer([]), undefined)
})
