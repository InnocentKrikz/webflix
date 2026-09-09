let viewerBootstrap: Promise<void> | null = null

function requestViewerIdentity() {
  return fetch('/api/backend/identity', {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
  }).then((response) => {
    if (!response.ok) throw new Error('Viewer identity unavailable')
  })
}

/** Serialize the first anonymous request so parallel cards do not create two guests. */
export function ensureViewerIdentity() {
  if (typeof window === 'undefined') return Promise.resolve()
  if (!viewerBootstrap) {
    viewerBootstrap = requestViewerIdentity().catch((error) => {
      viewerBootstrap = null
      throw error
    })
  }
  return viewerBootstrap
}

/** Re-run the merge after Better Auth changes the current session. */
export function syncViewerIdentity() {
  if (typeof window === 'undefined') return Promise.resolve()
  viewerBootstrap = requestViewerIdentity().catch((error) => {
    viewerBootstrap = null
    throw error
  })
  return viewerBootstrap
}

export type TitleViewStats = { viewCount: number; viewed: boolean }

function mediaRefForTitle(titleId: string) {
  const match = /^(movie|tv)-(\d+)$/.exec(titleId)
  if (!match) return null
  return {
    mediaType: match[1] === 'tv' ? 'TV' : 'MOVIE',
    tmdbId: Number(match[2]),
  } as const
}

export async function getTitleViewStats(titleId: string): Promise<TitleViewStats> {
  const ref = mediaRefForTitle(titleId)
  if (!ref) throw new Error('Invalid title')
  await ensureViewerIdentity()
  const params = new URLSearchParams({ mediaType: ref.mediaType, tmdbId: String(ref.tmdbId) })
  const response = await fetch(`/api/backend/views?${params.toString()}`, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!response.ok) throw new Error('View count unavailable')
  return response.json() as Promise<TitleViewStats>
}

export async function recordTitleView(titleId: string): Promise<TitleViewStats> {
  const ref = mediaRefForTitle(titleId)
  if (!ref) throw new Error('Invalid title')
  await ensureViewerIdentity()
  const response = await fetch('/api/backend/views', {
    method: 'POST',
    credentials: 'include',
    keepalive: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ref),
  })
  if (!response.ok) throw new Error('View could not be recorded')
  return response.json() as Promise<TitleViewStats>
}
