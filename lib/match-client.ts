export type FeedbackValue = 'LIKE' | 'DISLIKE'
export type MatchResult = {
  score: number
  personalized: boolean
  confidence: 'low' | 'medium' | 'high'
  reasons: string[]
  feedback: FeedbackValue | null
}
export type MatchEntry = {
  match: MatchResult | null
  status: 'loading' | 'ready' | 'error'
  saving: boolean
  error: string | null
}
export const EMPTY_MATCH: MatchEntry = { match: null, status: 'loading', saving: false, error: null }
const BACKEND_URL = '/api/backend'

function mediaRef(id: string) {
  const match = /^(movie|tv)-(\d+)$/.exec(id)
  if (!match) throw new Error('Invalid title')
  return { mediaType: match[1] === 'tv' ? 'TV' : 'MOVIE', tmdbId: Number(match[2]) }
}

/** A viewer-scoped store: public catalog responses contain no viewer scores. */
export class MatchStore {
  private entries = new Map<string, MatchEntry>()
  private active = new Map<string, number>()
  private versions = new Map<string, number>()
  private listeners = new Set<() => void>()
  private queue = new Set<string>()
  private controllers = new Set<AbortController>()
  private ratingControllers = new Set<AbortController>()
  private timer: ReturnType<typeof setTimeout> | undefined
  private generation = 0
  private running = 0
  private disposed = false

  readonly userId: string | null
  constructor(userId: string | null) { this.userId = userId }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }
  get = (id: string) => this.entries.get(id) ?? EMPTY_MATCH
  private emit() { this.listeners.forEach((listener) => listener()) }

  retain = (id: string) => {
    this.active.set(id, (this.active.get(id) ?? 0) + 1)
    this.request(id)
    return () => {
      const count = (this.active.get(id) ?? 1) - 1
      if (count > 0) this.active.set(id, count)
      else this.active.delete(id)
    }
  }

  request = (id: string) => {
    if (this.entries.has(id) && this.versions.get(id) === this.generation) return
    this.entries.set(id, { ...this.get(id), status: 'loading' })
    this.versions.set(id, this.generation)
    if (this.entries.size > 1000) {
      for (const cachedId of this.entries.keys()) {
        if (this.active.has(cachedId)) continue
        this.entries.delete(cachedId)
        this.versions.delete(cachedId)
        if (this.entries.size <= 1000) break
      }
    }
    this.queue.add(id)
    this.schedule()
  }

  private schedule() {
    if (this.disposed || this.timer || !this.queue.size) return
    this.timer = setTimeout(() => {
      this.timer = undefined
      void this.flush()
    }, 40)
  }

  private async flush() {
    if (this.disposed || this.running >= 2 || !this.queue.size) return
    const ids = [...this.queue].slice(0, 100)
    ids.forEach((id) => this.queue.delete(id))
    const generation = this.generation
    const controller = new AbortController()
    this.controllers.add(controller)
    this.running++
    this.schedule()
    try {
      const response = await fetch(`${BACKEND_URL}/matches`, {
        method: 'POST', credentials: 'include', cache: 'no-store', signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titles: ids.map(mediaRef) }),
      })
      if (!response.ok) throw new Error('Unable to load matches')
      const payload = await response.json() as { matches: Record<string, MatchResult | null> }
      if (generation !== this.generation || this.disposed) return
      for (const id of ids) {
        const match = payload.matches[id] ?? null
        this.entries.set(id, { ...this.get(id), match, status: match ? 'ready' : 'error' })
      }
    } catch {
      if (generation !== this.generation || this.disposed) return
      for (const id of ids) this.entries.set(id, { ...this.get(id), status: 'error' })
    } finally {
      this.controllers.delete(controller)
      this.running--
      if (!this.disposed) { this.emit(); this.schedule() }
    }
  }

  refresh = () => {
    if (this.disposed) return
    this.generation++
    this.controllers.forEach((controller) => controller.abort())
    this.queue.clear()
    for (const id of this.active.keys()) this.request(id)
    this.emit()
    this.schedule()
  }

  rate = async (id: string, value: FeedbackValue | null) => {
    if (this.disposed || this.get(id).saving) return false
    this.request(id)
    this.entries.set(id, { ...this.get(id), saving: true, error: null })
    this.emit()
    const controller = new AbortController()
    this.ratingControllers.add(controller)
    try {
      const response = await fetch(`${BACKEND_URL}/feedback`, {
        method: 'PUT', credentials: 'include', signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...mediaRef(id), value }),
      })
      if (!response.ok) throw new Error('Your rating could not be saved. Please try again.')
      if (this.disposed) return false
      this.refresh()
      // Publish explicit feedback only after it has been persisted successfully.
      this.entries.set(id, {
        ...this.get(id), saving: false, error: null,
        match: value ? {
          score: value === 'LIKE' ? 98 : 5, personalized: true, confidence: 'high', feedback: value,
          reasons: [value === 'LIKE' ? 'You liked this title' : 'You disliked this title'],
        } : null,
      })
      this.emit()
      return true
    } catch {
      if (!this.disposed) {
        this.entries.set(id, { ...this.get(id), saving: false, error: 'Your rating could not be saved. Please try again.' })
        this.emit()
      }
      return false
    } finally {
      this.ratingControllers.delete(controller)
    }
  }

  activate = () => {
    this.disposed = false
    // Also supports React's development effect cleanup/restart cycle.
    for (const id of this.active.keys()) this.request(id)
    this.schedule()
  }

  dispose = () => {
    this.disposed = true
    this.generation++
    clearTimeout(this.timer)
    this.timer = undefined
    this.controllers.forEach((controller) => controller.abort())
    this.ratingControllers.forEach((controller) => controller.abort())
  }
}
