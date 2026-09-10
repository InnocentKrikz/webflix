import test from 'node:test'
import assert from 'node:assert/strict'
import { fetchCatalog } from '../lib/catalog-client.ts'

test('duplicate consumers share one request and one decoded response', async (t) => {
  let calls = 0
  t.mock.method(globalThis, 'fetch', async () => { calls++; return new Response('{"title":"Shared"}') })
  const url = '/fixture/shared'
  const [a, b] = await Promise.all([fetchCatalog(url), fetchCatalog(url)])
  assert.equal(a, b)
  assert.equal(await fetchCatalog(url), a)
  assert.equal(calls, 1)
})

test('cancelling one consumer keeps the request alive for another', async (t) => {
  let resolve
  let fetchSignal
  t.mock.method(globalThis, 'fetch', (_url, { signal }) => {
    fetchSignal = signal
    return new Promise((done) => { resolve = done })
  })
  const first = new AbortController()
  const a = fetchCatalog('/fixture/partial-abort', first.signal)
  const b = fetchCatalog('/fixture/partial-abort')
  first.abort()
  await assert.rejects(a, { name: 'AbortError' })
  assert.equal(fetchSignal.aborted, false)
  resolve(new Response('[1,2]'))
  assert.deepEqual(await b, [1, 2])
})

test('last-consumer cancellation aborts fetch and permits an immediate retry', async (t) => {
  const signals = []
  t.mock.method(globalThis, 'fetch', (_url, { signal }) => {
    signals.push(signal)
    if (signals.length > 1) return Promise.resolve(new Response('[3]'))
    return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))))
  })
  const controller = new AbortController()
  const stale = fetchCatalog('/fixture/last-abort', controller.signal)
  controller.abort()
  const fresh = fetchCatalog('/fixture/last-abort')
  await assert.rejects(stale, { name: 'AbortError' })
  assert.equal(signals[0].aborted, true)
  assert.deepEqual(await fresh, [3])
  assert.equal(signals.length, 2)
})
