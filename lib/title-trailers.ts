import type { Title, Trailer } from './types'

/** Preserve samples when the same title arrives from a compact card response. */
export function withFallbackTrailerTimelines(preferred: Title, fallback: Title | undefined): Title {
  if (!fallback?.trailers.length || preferred.id !== fallback.id) return preferred
  const key = (trailer: Trailer) => trailer.videoKey || trailer.id
  const available = new Map(fallback.trailers.map((trailer) => [key(trailer), trailer]))
  let changed = false
  const trailers = preferred.trailers.map((trailer) => {
    const other = available.get(key(trailer))
    available.delete(key(trailer))
    if (trailer.timeline.length || !other?.timeline.length) return trailer
    changed = true
    return { ...trailer, timeline: other.timeline }
  })
  for (const trailer of available.values()) {
    trailers.push(trailer)
    changed = true
  }
  return changed ? { ...preferred, trailers } : preferred
}

/** Use the same video for the visible player and its time-indexed colours. */
export function selectShowcaseTrailer(trailers: readonly Trailer[]): Trailer | undefined {
  return trailers.find((trailer) => trailer.videoKey && trailer.timeline.length)
    ?? trailers.find((trailer) => trailer.videoKey)
}
