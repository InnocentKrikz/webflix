import type { Title } from './types'

type Cached = { value: unknown; expires: number }
type Flight = { promise: Promise<unknown>; controller: AbortController; users: number }
const cache = new Map<string, Cached>()
const flights = new Map<string, Flight>()

/** Public catalog only. Last-consumer cancellation also cancels the network request. */
export function fetchCatalog<T>(url: string, signal?: AbortSignal): Promise<T> {
  if (signal?.aborted) return Promise.reject(new DOMException('Aborted', 'AbortError'))
  const cached = cache.get(url)
  if (cached && cached.expires > Date.now()) return Promise.resolve(cached.value as T)
  cache.delete(url)
  let flight = flights.get(url)
  if (!flight || flight.controller.signal.aborted) {
    const controller = new AbortController()
    const created: Flight = { controller, users: 0, promise: Promise.resolve() }
    created.promise = fetch(url, { signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error('Catalog unavailable')
      const value = await response.json()
      for (const [key, entry] of cache) if (entry.expires <= Date.now()) cache.delete(key)
      while (cache.size >= 60) cache.delete(cache.keys().next().value!)
      cache.set(url, { value, expires: Date.now() + 60_000 })
      return value
    }).finally(() => { if (flights.get(url) === created) flights.delete(url) })
    flights.set(url, created)
    flight = created
  }
  const active = flight
  active.users++
  return new Promise<T>((resolve, reject) => {
    let done = false
    const finish = () => {
      if (done) return false
      done = true
      signal?.removeEventListener('abort', abort)
      if (--active.users === 0 && flights.get(url) === active) active.controller.abort()
      return true
    }
    const abort = () => { if (finish()) reject(new DOMException('Aborted', 'AbortError')) }
    signal?.addEventListener('abort', abort, { once: true })
    active.promise.then((value) => { if (finish()) resolve(value as T) }, (error) => { if (finish()) reject(error) })
  })
}

let prefetches = 0
export function prefetchTitle(id: string) {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
  if (connection?.saveData || connection?.effectiveType === '2g' || prefetches >= 2) return
  void import('@/components/detail-modal')
  prefetches++
  void fetchCatalog<Title>(`/api/titles/${id}`).catch(() => {}).finally(() => { prefetches-- })
}
