import type { Episode, Season, Title } from './types'

// TMDB release dates have day precision. Use the same UTC day on server and client.
export function releaseDay(value?: string | null): number | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}(?:T|$)/.test(value)) return null
  const day = value.slice(0, 10)
  const timestamp = Date.parse(`${day}T00:00:00Z`)
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === day ? timestamp : null
}

export function hasReleased(value?: string | null, now = Date.now()) {
  const date = releaseDay(value)
  return date !== null && date <= now
}

export function isTitleReleased(title: Pick<Title, 'type' | 'releaseDate' | 'status' | 'upcoming'>, now = Date.now()) {
  const date = releaseDay(title.releaseDate)
  const status = title.status.trim().toLowerCase()
  if (date !== null && date > now) return false
  if (title.type === 'movie' && ['rumored', 'planned', 'in production', 'post production'].includes(status)) return false
  if (date !== null) return true
  if (title.upcoming) return false
  return ['released', 'returning series', 'ended', 'canceled'].includes(status)
}

export function isSeasonReleased(season: Season, now = Date.now()) {
  const date = releaseDay(season.releaseDate)
  if (date !== null) return date <= now
  return season.episodes.some((episode) => hasReleased(episode.releaseDate, now))
}

export function isEpisodeReleased(title: Title, season: Season, episode: Episode, now = Date.now()) {
  return isTitleReleased(title, now) && isSeasonReleased(season, now) && hasReleased(episode.releaseDate, now)
}

export type PlaybackTarget = { seasonIndex: number; episodeIndex: number }

export function resolvePlayback(title: Title, seasonNumber?: number, episodeNumber?: number, now = Date.now()): PlaybackTarget | null {
  if (!isTitleReleased(title, now)) return null
  if (title.type === 'movie') return { seasonIndex: 0, episodeIndex: 0 }
  for (const [seasonIndex, season] of (title.seasons ?? []).entries()) {
    if (seasonNumber !== undefined && season.number !== seasonNumber) continue
    for (const [episodeIndex, episode] of season.episodes.entries()) {
      if (episodeNumber !== undefined && episode.number !== episodeNumber) continue
      if (isEpisodeReleased(title, season, episode, now)) return { seasonIndex, episodeIndex }
    }
  }
  return null
}

export function nextPlaybackTarget(title: Title, current: PlaybackTarget, now = Date.now()): PlaybackTarget | null {
  for (const [seasonIndex, season] of (title.seasons ?? []).entries()) {
    if (seasonIndex < current.seasonIndex) continue
    for (const [episodeIndex, episode] of season.episodes.entries()) {
      if (seasonIndex === current.seasonIndex && episodeIndex <= current.episodeIndex) continue
      if (isEpisodeReleased(title, season, episode, now)) return { seasonIndex, episodeIndex }
    }
  }
  return null
}
