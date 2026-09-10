import test from 'node:test'
import assert from 'node:assert/strict'
import { setTimeout as delay } from 'node:timers/promises'
import { MatchStore } from '../lib/match-client.ts'

const result = (score = 75, feedback = null) => ({
  score, feedback, personalized: false, confidence: 'low', reasons: ['Initial estimate'],
})
const response = (matches) => new Response(JSON.stringify({ matches }), { status: 200 })
async function until(check) {
  for (let i = 0; i < 100; i++) { if (check()) return; await delay(10) }
  assert.fail('Timed out waiting for the match store')
}

test('duplicate cards share a batch and inactive titles are not refreshed during playback', async (t) => {
  const store = new MatchStore('account-a')
  t.after(() => store.dispose())
  const calls = []
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    const ids = JSON.parse(options.body).titles.map((ref) => `${ref.mediaType === 'TV' ? 'tv' : 'movie'}-${ref.tmdbId}`)
    calls.push(ids)
    return response(Object.fromEntries(ids.map((id) => [id, result()])))
  })
  const releaseOne = store.retain('movie-1')
  const releaseDuplicate = store.retain('movie-1')
  const releaseTwo = store.retain('tv-1')
  await until(() => store.get('tv-1').status === 'ready')
  assert.deepEqual(calls, [['movie-1', 'tv-1']])
  releaseOne(); releaseDuplicate(); releaseTwo()
  store.refresh()
  await delay(70)
  assert.equal(calls.length, 1)
  store.retain('movie-1')
  await until(() => calls.length === 2)
  assert.deepEqual(calls[1], ['movie-1'])
})

test('failed feedback preserves the saved rating and exposes a retryable error', async (t) => {
  const store = new MatchStore('account-a')
  t.after(() => store.dispose())
  t.mock.method(globalThis, 'fetch', async (_url, options) => options.method === 'PUT'
    ? new Response('{}', { status: 503 }) : response({ 'movie-1': result(98, 'LIKE') }))
  store.retain('movie-1')
  await until(() => store.get('movie-1').status === 'ready')
  assert.equal(await store.rate('movie-1', 'DISLIKE'), false)
  assert.equal(store.get('movie-1').match.feedback, 'LIKE')
  assert.equal(store.get('movie-1').saving, false)
  assert.match(store.get('movie-1').error, /try again/)
})

test('a stale in-flight score cannot overwrite newly saved feedback', async (t) => {
  const store = new MatchStore('account-a')
  t.after(() => store.dispose())
  const pending = []
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    if (options.method === 'PUT') return new Response('{}', { status: 200 })
    return new Promise((resolve) => pending.push(resolve))
  })
  store.retain('movie-1')
  await until(() => pending.length === 1)
  assert.equal(await store.rate('movie-1', 'LIKE'), true)
  pending[0](response({ 'movie-1': result(40) })) // Simulate a server ignoring abort.
  await delay(10)
  assert.equal(store.get('movie-1').match.feedback, 'LIKE')
  await until(() => pending.length === 2)
  pending[1](response({ 'movie-1': result(98, 'LIKE') }))
  await until(() => store.get('movie-1').status === 'ready')
  assert.equal(store.get('movie-1').match.score, 98)
})

test('logout and account switches discard previous sessions and late responses', async (t) => {
  const first = new MatchStore('account-a')
  const second = new MatchStore('account-b')
  const guest = new MatchStore(null)
  t.after(() => { first.dispose(); second.dispose(); guest.dispose() })
  let resolveFirst
  let calls = 0
  t.mock.method(globalThis, 'fetch', async () => {
    calls++
    if (calls === 1) return new Promise((resolve) => { resolveFirst = resolve })
    return response({ 'movie-1': result(71) })
  })
  first.retain('movie-1')
  await until(() => Boolean(resolveFirst))
  first.dispose()
  second.retain('movie-1')
  guest.retain('movie-1')
  await until(() => second.get('movie-1').status === 'ready')
  resolveFirst(response({ 'movie-1': result(98, 'LIKE') }))
  await delay(10)
  assert.equal(second.get('movie-1').match.score, 71)
  assert.equal(guest.get('movie-1').match.score, 71)
  assert.equal(calls, 3)
  assert.equal(await guest.rate('movie-1', 'LIKE'), true)
})

test('quick remounts and development effect restarts do not strand loading scores', async (t) => {
  const store = new MatchStore('account-a')
  t.after(() => store.dispose())
  t.mock.method(globalThis, 'fetch', async () => response({ 'movie-1': result() }))
  store.retain('movie-1')()
  store.retain('movie-1')
  store.dispose()
  store.activate()
  await until(() => store.get('movie-1').status === 'ready')
})
