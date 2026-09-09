'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ArrowLeft, Check, ListVideo, Server, SkipBack, SkipForward } from 'lucide-react'
import { isEpisodeReleased, nextPlaybackTarget, previousPlaybackTarget, resolvePlayback, type PlaybackTarget } from '@/lib/availability'
import { cn, parseDurationToSeconds } from '@/lib/utils'
import { ensureViewerIdentity, recordTitleView } from '@/lib/viewer-client'
import {
  buildProviderUrl,
  getPlayerProvider,
  PLAYER_PROVIDERS,
  VIDUKI_PROVIDERS,
  type PlayerProviderId,
} from '@/lib/player-servers'
import type { Title } from '@/lib/types'

const VIDUKI_PROGRESS_KEY = 'vidukinet-Progress'
const BACKEND_URL = '/api/backend'

type JsonRecord = Record<string, unknown>

type VidukiProgress = {
  watched?: number | string
  duration?: number | string
}

type SharedProgress = {
  progressSeconds: number
  durationSeconds: number
  completed: boolean
}

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : null
}

function finiteNumber(value: unknown): number | null {
  const number = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN
  return Number.isFinite(number) ? number : null
}

function progressRecord(value: unknown): VidukiProgress | null {
  const record = asRecord(value)
  if (!record) return null
  return {
    watched: record.watched as number | string | undefined,
    duration: record.duration as number | string | undefined,
  }
}

function mediaRecordFor(payload: unknown, tmdbId: number): JsonRecord | null {
  const root = asRecord(payload)
  if (!root) return null

  const keyed = asRecord(root[String(tmdbId)])
  if (keyed) return keyed

  const rootId = finiteNumber(root.id)
  if (rootId === tmdbId || 'progress' in root || 'show_progress' in root) return root

  for (const value of Object.values(root)) {
    const candidate = asRecord(value)
    if (candidate && finiteNumber(candidate.id) === tmdbId) return candidate
  }

  return null
}

function episodeProgressFor(record: JsonRecord, seasonNumber: number | undefined, episodeNumber: number | undefined) {
  if (seasonNumber === undefined || episodeNumber === undefined) return progressRecord(record.progress)
  const showProgress = asRecord(record.show_progress)
  const episode = showProgress?.[`s${seasonNumber}e${episodeNumber}`]
  return progressRecord(asRecord(episode)?.progress) ?? progressRecord(record.progress)
}

export function ProviderPlayer({
  title,
  initialSeason,
  initialEpisode,
  providerId = 'viduki-api-1',
  onProviderChange,
}: {
  title: Title
  initialSeason?: number
  initialEpisode?: number
  providerId?: PlayerProviderId
  onProviderChange?: (providerId: PlayerProviderId) => void
}) {
  const router = useRouter()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const latestProgress = useRef<SharedProgress | null>(null)
  const progressReadyKey = useRef<string | null>(null)
  const lastSavedProgress = useRef('')
  const overlayHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [fallbackProviderId, setFallbackProviderId] = useState<PlayerProviderId>(providerId)
  const [showOverlayControls, setShowOverlayControls] = useState(true)
  const [controlsHovered, setControlsHovered] = useState(false)
  const [providerMenuOpen, setProviderMenuOpen] = useState(false)
  const [episodeMenuOpen, setEpisodeMenuOpen] = useState(false)

  const revealOverlayControls = useCallback(() => {
    setShowOverlayControls(true)
    if (overlayHideTimer.current) clearTimeout(overlayHideTimer.current)
    overlayHideTimer.current = setTimeout(() => setShowOverlayControls(false), 3000)
  }, [])

  const controlsVisible = showOverlayControls || controlsHovered || providerMenuOpen || episodeMenuOpen

  useEffect(() => {
    revealOverlayControls()
    return () => {
      if (overlayHideTimer.current) clearTimeout(overlayHideTimer.current)
    }
  }, [revealOverlayControls])

  useEffect(() => {
    setFallbackProviderId(providerId)
  }, [providerId])

  const target = resolvePlayback(title, initialSeason, initialEpisode)
  const [seasonIndex, setSeasonIndex] = useState(target?.seasonIndex ?? 0)
  const [episodeIndex, setEpisodeIndex] = useState(target?.episodeIndex ?? 0)

  useEffect(() => {
    if (!target) return
    setSeasonIndex(target.seasonIndex)
    setEpisodeIndex(target.episodeIndex)
  }, [target?.episodeIndex, target?.seasonIndex, title.id])

  const season = title.type === 'tv' ? title.seasons?.[seasonIndex] : undefined
  const episode = season?.episodes[episodeIndex]
  const seasonNumber = season?.number
  const episodeNumber = episode?.number
  const tmdbId = Number(title.id.split('-').at(-1))
  const fallbackDuration = title.type === 'tv' && episode
    ? parseDurationToSeconds(episode.duration)
    : parseDurationToSeconds(title.runtime)
  const activeProvider = getPlayerProvider(fallbackProviderId)
  const progressKey = `${title.id}:${seasonNumber ?? ''}:${episodeNumber ?? ''}`
  const [resumeAt, setResumeAt] = useState(0)
  const [progressReady, setProgressReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    progressReadyKey.current = null
    latestProgress.current = null
    lastSavedProgress.current = ''
    setProgressReady(false)
    setResumeAt(0)

    const params = new URLSearchParams({
      mediaType: title.type === 'tv' ? 'TV' : 'MOVIE',
      tmdbId: String(tmdbId),
    })
    if (title.type === 'tv') {
      params.set('seasonNumber', String(seasonNumber ?? 1))
      params.set('episodeNumber', String(episodeNumber ?? 1))
    }

    ensureViewerIdentity()
      .then(() => fetch(`${BACKEND_URL}/progress?${params.toString()}`, { credentials: 'include' }))
      .then((response) => {
        if (!response.ok) throw new Error('Unable to load progress')
        return response.json() as Promise<{ progress?: { progressSeconds?: number; durationSeconds?: number; completed?: boolean } } | null>
      })
      .then((payload) => {
        if (cancelled) return
        const saved = payload?.progress
        const durationSeconds = Math.max(0, finiteNumber(saved?.durationSeconds) ?? fallbackDuration)
        const progressSeconds = Math.min(durationSeconds || Number.POSITIVE_INFINITY, Math.max(0, finiteNumber(saved?.progressSeconds) ?? 0))
        latestProgress.current = {
          progressSeconds,
          durationSeconds,
          completed: saved?.completed === true || (durationSeconds > 0 && progressSeconds / durationSeconds >= 0.9),
        }
        setResumeAt(progressSeconds)
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          progressReadyKey.current = progressKey
          setProgressReady(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [episodeNumber, fallbackDuration, progressKey, seasonNumber, title.type, tmdbId])

  const viewLoggedFor = useRef<string | null>(null)
  useEffect(() => {
    if (!progressReady || viewLoggedFor.current === title.id) return
    viewLoggedFor.current = title.id
    void recordTitleView(title.id).catch(() => {
      if (viewLoggedFor.current === title.id) viewLoggedFor.current = null
    })
  }, [progressReady, title.id])

  const url = useMemo(
    () => buildProviderUrl(activeProvider, title, tmdbId, seasonNumber, episodeNumber, resumeAt),
    [activeProvider, episodeNumber, resumeAt, seasonNumber, title, tmdbId],
  )

  const currentTarget: PlaybackTarget = { seasonIndex, episodeIndex }
  const previousTarget = useMemo(
    () => title.type === 'tv' ? previousPlaybackTarget(title, currentTarget) : null,
    [episodeIndex, seasonIndex, title],
  )
  const nextTarget = useMemo(
    () => title.type === 'tv' ? nextPlaybackTarget(title, currentTarget) : null,
    [episodeIndex, seasonIndex, title],
  )
  const episodeOptions = useMemo(
    () => title.seasons?.flatMap((seasonOption, nextSeasonIndex) => seasonOption.episodes
      .map((episodeOption, nextEpisodeIndex) => ({
        season: seasonOption,
        episode: episodeOption,
        target: { seasonIndex: nextSeasonIndex, episodeIndex: nextEpisodeIndex },
      }))
      .filter(({ season: seasonOption, episode: episodeOption }) => isEpisodeReleased(title, seasonOption, episodeOption))) ?? [],
    [title],
  )

  const saveProgress = useCallback((progress: SharedProgress) => {
    if (!Number.isInteger(tmdbId) || tmdbId <= 0 || progressReadyKey.current !== progressKey) return
    if (progress.durationSeconds <= 0 || progress.progressSeconds <= 0) return

    const progressSeconds = Math.min(progress.durationSeconds, Math.max(0, progress.progressSeconds))
    const signature = `${progressKey}:${Math.floor(progressSeconds)}:${progress.durationSeconds}`
    if (lastSavedProgress.current === signature) return
    lastSavedProgress.current = signature

    void fetch(`${BACKEND_URL}/progress`, {
      method: 'PUT',
      credentials: 'include',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mediaType: title.type === 'tv' ? 'TV' : 'MOVIE',
        tmdbId,
        seasonNumber: title.type === 'tv' ? seasonNumber ?? 1 : null,
        episodeNumber: title.type === 'tv' ? episodeNumber ?? 1 : null,
        progressSeconds,
        durationSeconds: progress.durationSeconds,
        completed: progress.completed || progressSeconds / progress.durationSeconds >= 0.9,
      }),
    }).then((response) => {
      if (!response.ok) throw new Error('Progress was not saved')
      window.dispatchEvent(new Event('sceneflix:activity'))
    }).catch(() => {
      if (lastSavedProgress.current === signature) lastSavedProgress.current = ''
    })
  }, [episodeNumber, progressKey, seasonNumber, title, tmdbId])

  const progressFromVidukiData = useCallback((payload: unknown): SharedProgress | null => {
    const mediaRecord = mediaRecordFor(payload, tmdbId)
    if (!mediaRecord) return null
    const progress = episodeProgressFor(mediaRecord, seasonNumber, episodeNumber)
    const watched = finiteNumber(progress?.watched)
    const durationSeconds = finiteNumber(progress?.duration) ?? fallbackDuration
    if (watched === null || durationSeconds <= 0) return null
    return {
      progressSeconds: Math.min(durationSeconds, Math.max(0, watched)),
      durationSeconds,
      completed: durationSeconds > 0 && watched / durationSeconds >= 0.9,
    }
  }, [episodeNumber, fallbackDuration, seasonNumber, tmdbId])

  const flushProgress = useCallback(() => {
    if (latestProgress.current) saveProgress(latestProgress.current)
  }, [saveProgress])

  const goToEpisode = useCallback((next: PlaybackTarget | null) => {
    if (!next) return
    const nextSeason = title.seasons?.[next.seasonIndex]
    const nextEpisode = nextSeason?.episodes[next.episodeIndex]
    if (!nextSeason || !nextEpisode || !isEpisodeReleased(title, nextSeason, nextEpisode)) return

    // Flush the provider's last event while the current season/episode is still
    // in scope, otherwise it can be attributed to the episode being opened.
    flushProgress()
    latestProgress.current = null
    progressReadyKey.current = null
    lastSavedProgress.current = ''
    setProgressReady(false)
    setResumeAt(0)

    // Keep the watch URL shareable/bookmarkable without asking Next to navigate
    // or reload the server-rendered page.
    const url = new URL(window.location.href)
    url.searchParams.set('s', String(nextSeason.number))
    url.searchParams.set('e', String(nextEpisode.number))
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)

    setSeasonIndex(next.seasonIndex)
    setEpisodeIndex(next.episodeIndex)
  }, [flushProgress, title])

  const switchProvider = useCallback((nextProviderId: PlayerProviderId) => {
    const progress = latestProgress.current
    if (progress) {
      saveProgress(progress)
      setResumeAt(progress.progressSeconds)
    }
    setFallbackProviderId(nextProviderId)
    onProviderChange?.(nextProviderId)
    revealOverlayControls()
  }, [onProviderChange, revealOverlayControls, saveProgress])

  useEffect(() => {
    function onMessage(event: MessageEvent<unknown>) {
      if (event.origin !== activeProvider.origin) return
      if (event.source && event.source !== iframeRef.current?.contentWindow) return

      const data = asRecord(event.data)
      if (!data) return

      if (activeProvider.kind === 'viduki' && data.type === 'viduki:all-servers-failed') {
        const currentIndex = VIDUKI_PROVIDERS.findIndex((provider) => provider.id === fallbackProviderId)
        const nextProvider = VIDUKI_PROVIDERS[currentIndex + 1]
        if (nextProvider) switchProvider(nextProvider.id)
        return
      }

      if (activeProvider.kind === 'viduki' && data.type === 'MEDIA_DATA') {
        try {
          window.localStorage.setItem(VIDUKI_PROGRESS_KEY, JSON.stringify(data.data))
        } catch {
          // Storage can be unavailable in privacy-restricted browser contexts.
        }
        const progress = progressFromVidukiData(data.data)
        if (progress && progressReadyKey.current === progressKey) {
          latestProgress.current = progress
          saveProgress(progress)
        }
        return
      }

      if (data.type === 'PLAYER_EVENT') {
        const eventData = asRecord(data.data)
        const progressSeconds = finiteNumber(eventData?.player_progress)
        const durationSeconds = Math.max(0, finiteNumber(eventData?.player_duration) ?? fallbackDuration)
        if (progressSeconds === null || durationSeconds <= 0) return
        const status = eventData?.player_status
        const progress = {
          progressSeconds: Math.min(durationSeconds, Math.max(0, progressSeconds)),
          durationSeconds,
          completed: status === 'completed' || progressSeconds / durationSeconds >= 0.9,
        }
        if (progressReadyKey.current === progressKey) {
          latestProgress.current = progress
          saveProgress(progress)
        }
      }
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [activeProvider, fallbackDuration, fallbackProviderId, onProviderChange, progressFromVidukiData, progressKey, saveProgress, switchProvider])

  if (!target) return null

  if (!progressReady) {
    return <main className="h-screen w-screen bg-black" aria-busy="true" />
  }

  return (
    <main
      className="relative h-screen w-screen overflow-hidden bg-black text-foreground"
      onMouseMove={revealOverlayControls}
      onTouchStart={revealOverlayControls}
    >
      <iframe
        ref={iframeRef}
        key={url}
        src={url}
        title={`${title.title} player`}
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        allowFullScreen
        className="absolute inset-0 size-full border-0"
      />
      <div
        className="absolute left-0 top-0 z-10 h-24 w-16 cursor-pointer"
        onMouseEnter={revealOverlayControls}
        onTouchStart={revealOverlayControls}
        onClick={() => setShowOverlayControls((visible) => !visible)}
        aria-hidden="true"
      />
      <div
        className="absolute right-0 top-0 z-10 h-24 w-16 cursor-pointer"
        onMouseEnter={revealOverlayControls}
        onTouchStart={revealOverlayControls}
        onClick={() => setShowOverlayControls((visible) => !visible)}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center gap-4 p-4 transition-opacity duration-300 sm:p-6">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Back"
          className={cn(
            'grid size-10 shrink-0 place-items-center rounded-full border border-white/15 bg-black/25 backdrop-blur-md transition-colors hover:bg-white/10',
            controlsVisible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
          )}
        >
          <ArrowLeft className="size-6" />
        </button>
       
      </div>

      <div
        className={cn(
          'absolute left-4 top-1/2 z-20 -translate-y-1/2 transition-all duration-300 sm:left-6',
          controlsVisible ? 'pointer-events-auto translate-x-0 opacity-100' : 'pointer-events-none -translate-x-3 opacity-0',
        )}
        onMouseEnter={() => {
          setControlsHovered(true)
          revealOverlayControls()
        }}
        onMouseLeave={() => {
          setControlsHovered(false)
          revealOverlayControls()
        }}
      >
        <DropdownMenu.Root open={providerMenuOpen} onOpenChange={(open) => {
          setProviderMenuOpen(open)
          if (open) revealOverlayControls()
        }}>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              aria-label={`Streaming provider: ${activeProvider.label}`}
              title={activeProvider.label}
              className="grid size-10 place-items-center rounded-full border border-white/20 bg-black/45 text-xs font-semibold shadow-lg shadow-black/20 backdrop-blur-xl transition-colors hover:border-white/35 hover:bg-black/65"
            >
              <Server className="size-4 text-foreground/80" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              side="bottom"
              align="start"
              sideOffset={8}
              className="z-[60] max-h-[min(60vh,28rem)] w-64 overflow-y-auto rounded-2xl border border-white/15 bg-black/85 p-1.5 text-foreground shadow-2xl shadow-black/40 backdrop-blur-2xl"
            >
              <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Sources</p>
              {PLAYER_PROVIDERS.map((provider) => (
                <DropdownMenu.Item
                  key={provider.id}
                  onSelect={() => {
                    switchProvider(provider.id)
                  }}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 outline-none transition-colors data-[highlighted]:bg-white/10"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{provider.label}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">{provider.description}</span>
                  </span>
                  {activeProvider.id === provider.id && <Check className="size-4 shrink-0 text-primary" />}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      {title.type === 'tv' && (
        <div
          className={cn(
            'absolute right-4 top-1/2 z-20 -translate-y-1/2 transition-all duration-300 sm:right-6',
            controlsVisible ? 'pointer-events-auto translate-x-0 opacity-100' : 'pointer-events-none translate-x-3 opacity-0',
          )}
          onMouseEnter={() => {
            setControlsHovered(true)
            revealOverlayControls()
          }}
          onMouseLeave={() => {
            setControlsHovered(false)
            revealOverlayControls()
          }}
        >
          <div className="pointer-events-auto flex flex-col items-center gap-2 rounded-full border border-white/20 bg-black/35 p-2 shadow-lg shadow-black/20 backdrop-blur-md">
            <button
              type="button"
              onClick={() => goToEpisode(previousTarget)}
              disabled={!previousTarget}
              aria-label="Previous episode"
              title="Previous episode"
              className="grid size-9 place-items-center rounded-full text-foreground transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <SkipBack className="size-4" />
            </button>
            <DropdownMenu.Root open={episodeMenuOpen} onOpenChange={(open) => {
              setEpisodeMenuOpen(open)
              if (open) revealOverlayControls()
            }}>
              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  aria-label="Select episode"
                  title={`S${season?.number}:E${episode?.number} · ${episode?.title ?? 'Episode'}`}
                  className="grid size-9 place-items-center rounded-full border border-white/15 bg-white/5 transition-colors hover:bg-white/15"
                >
                  <ListVideo className="size-4" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  side="left"
                  align="center"
                  sideOffset={10}
                  className="z-[60] max-h-[min(70vh,32rem)] w-72 overflow-y-auto rounded-2xl border border-white/15 bg-black/85 p-1.5 text-foreground shadow-2xl shadow-black/40 backdrop-blur-2xl"
                >
                  <p className="sticky top-0 z-10 bg-black/85 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground backdrop-blur-2xl">
                    Episodes
                  </p>
                  {episodeOptions.map(({ season: seasonOption, episode: episodeOption, target: optionTarget }) => {
                    const selected = optionTarget.seasonIndex === seasonIndex && optionTarget.episodeIndex === episodeIndex
                    return (
                      <DropdownMenu.Item
                        key={`${optionTarget.seasonIndex}:${optionTarget.episodeIndex}`}
                        onSelect={() => {
                          goToEpisode(optionTarget)
                          revealOverlayControls()
                        }}
                        className={cn(
                          'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 outline-none transition-colors data-[highlighted]:bg-white/10',
                          selected && 'bg-white/10',
                        )}
                      >
                        <span className="w-12 shrink-0 text-xs font-semibold text-muted-foreground">
                          S{seasonOption.number}:E{episodeOption.number}
                        </span>
                        <span className={cn('min-w-0 flex-1 truncate text-sm', selected ? 'font-semibold text-foreground' : 'text-foreground/80')}>
                          {episodeOption.title}
                        </span>
                        {selected && <Check className="size-4 shrink-0 text-primary" />}
                      </DropdownMenu.Item>
                    )
                  })}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
            <button
              type="button"
              onClick={() => goToEpisode(nextTarget)}
              disabled={!nextTarget}
              aria-label="Next episode"
              title="Next episode"
              className="grid size-9 place-items-center rounded-full text-foreground transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <SkipForward className="size-4" />
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

export function VidukiPlayer({
  title,
  initialSeason,
  initialEpisode,
  serverId = 'viduki-api-1',
  onServerChange,
}: {
  title: Title
  initialSeason?: number
  initialEpisode?: number
  serverId?: PlayerProviderId
  onServerChange?: (serverId: PlayerProviderId) => void
}) {
  return (
    <ProviderPlayer
      title={title}
      initialSeason={initialSeason}
      initialEpisode={initialEpisode}
      providerId={serverId}
      onProviderChange={onServerChange}
    />
  )
}
