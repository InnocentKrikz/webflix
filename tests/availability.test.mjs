import test from 'node:test'
import assert from 'node:assert/strict'
import { releaseDay, isTitleReleased, isEpisodeReleased, resolvePlayback, nextPlaybackTarget, pendingAdjacentSeason } from '../lib/availability.ts'

const now = Date.parse('2026-09-07T12:00:00Z')
const movie = { type: 'movie', status: 'Released', releaseDate: '2026-09-01' }
const episode = (number, releaseDate) => ({ number, releaseDate })
const show = {
  type: 'tv', status: 'Returning Series', releaseDate: '2020-01-01',
  seasons: [
    { number: 2, releaseDate: '2020-01-01', episodes: [episode(3, '2020-01-01'), episode(4, '2026-09-07'), episode(5, '2026-09-08')] },
    { number: 4, releaseDate: '2027-01-01', episodes: [episode(1, '2027-01-01')] },
  ],
}

test('future releases and unfinished movies cannot play even with misleading status or dates', () => {
  assert.equal(isTitleReleased(movie, now), true)
  assert.equal(isTitleReleased({ ...movie, releaseDate: '2026-09-08' }, now), false)
  assert.equal(isTitleReleased({ ...movie, status: 'Post Production' }, now), false)
  assert.equal(resolvePlayback({ ...movie, releaseDate: '2027-01-01' }, undefined, undefined, now), null)
})

test('release dates use UTC days and reject malformed or unknown dates', () => {
  assert.equal(isTitleReleased({ ...movie, releaseDate: '2026-09-07T00:00:00.000Z' }, now), true)
  assert.equal(isTitleReleased({ ...movie, releaseDate: '2026-09-07' }, now - 13 * 3600_000), false)
  assert.equal(releaseDay('2026-02-30'), null)
  assert.equal(releaseDay('not a date'), null)
  assert.equal(isTitleReleased({ ...movie, status: '', releaseDate: undefined }, now), false)
  assert.equal(isTitleReleased({ ...movie, releaseDate: undefined }, now), true)
})

test('a released show does not unlock future seasons or episodes with missing air dates', () => {
  assert.equal(isTitleReleased(show, now), true)
  assert.equal(isEpisodeReleased(show, show.seasons[0], show.seasons[0].episodes[1], now), true)
  assert.equal(isEpisodeReleased(show, show.seasons[0], show.seasons[0].episodes[2], now), false)
  assert.equal(isEpisodeReleased(show, show.seasons[1], episode(1, '2020-01-01'), now), false)
  assert.equal(isEpisodeReleased(show, show.seasons[0], episode(6, undefined), now), false)
  assert.equal(isEpisodeReleased(show, { ...show.seasons[0], releaseDate: undefined }, show.seasons[0].episodes[0], now), true)
})

test('watch links resolve actual season and episode numbers without clamping invalid or unreleased targets', () => {
  assert.deepEqual(resolvePlayback(show, undefined, undefined, now), { seasonIndex: 0, episodeIndex: 0 })
  assert.deepEqual(resolvePlayback(show, 2, 4, now), { seasonIndex: 0, episodeIndex: 1 })
  for (const [season, ep] of [[1, 1], [2, 1], [2, 5], [4, 1], [99, 99]]) {
    assert.equal(resolvePlayback(show, season, ep, now), null)
  }
  assert.equal(resolvePlayback({ ...show, seasons: [] }, undefined, undefined, now), null)
})

test('autoplay advances only to released episodes and stops before future content', () => {
  assert.deepEqual(nextPlaybackTarget(show, { seasonIndex: 0, episodeIndex: 0 }, now), { seasonIndex: 0, episodeIndex: 1 })
  assert.equal(nextPlaybackTarget(show, { seasonIndex: 0, episodeIndex: 1 }, now), null)
  assert.deepEqual(nextPlaybackTarget(show, { seasonIndex: 0, episodeIndex: 2 }, Date.parse('2027-01-02')), { seasonIndex: 1, episodeIndex: 0 })
})

test('navigation cannot jump over a season whose release data has not loaded', () => {
  const partiallyLoaded = {
    ...show,
    seasons: [
      { number: 1, releaseDate: '2020-01-01', episodesLoaded: true, episodes: [episode(1, '2020-01-01')] },
      { number: 2, releaseDate: '2020-01-01', episodesLoaded: false, episodes: [] },
      { number: 3, releaseDate: '2020-01-01', episodesLoaded: true, episodes: [episode(1, '2020-01-01')] },
    ],
  }
  assert.equal(nextPlaybackTarget(partiallyLoaded, { seasonIndex: 0, episodeIndex: 0 }, now), null)
  assert.equal(pendingAdjacentSeason(partiallyLoaded, 0, 1, now), 2)
  partiallyLoaded.seasons[1].episodesLoaded = true
  assert.equal(pendingAdjacentSeason(partiallyLoaded, 0, 1, now), null)
  assert.deepEqual(nextPlaybackTarget(partiallyLoaded, { seasonIndex: 0, episodeIndex: 0 }, now), { seasonIndex: 2, episodeIndex: 0 })
})
