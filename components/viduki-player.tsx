'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ArrowLeft, Check, ListVideo, Maximize, Minimize, Server, SkipBack, SkipForward } from 'lucide-react'
import { pendingAdjacentSeason, isEpisodeReleased, nextPlaybackTarget, previousPlaybackTarget, resolvePlayback, type PlaybackTarget } from '@/lib/availability'
import { cn, parseDurationToSeconds } from '@/lib/utils'
import { ensureViewerIdentity, recordTitleView } from '@/lib/viewer-client'
import {
  buildProviderUrl,
  getPlayerProvider,
  PLAYER_PROVIDERS,
  VIDUKI_PROVIDERS,
  type PlayerProviderId,
} from '@/lib/player-servers'
import type { Title, Season } from '@/lib/types'
import { fetchCatalog } from '@/lib/catalog-client'

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
  title: initialTitle,
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
  const [loadedSeasons, setLoadedSeasons] = useState<Record<string, Season>>({})
  const [loadingSeason, setLoadingSeason] = useState<number | null>(null)
  const [seasonError, setSeasonError] = useState(false)
  const title = useMemo(() => ({
    ...initialTitle,
    seasons: initialTitle.seasons?.map((season) => loadedSeasons[`${initialTitle.id}:${season.number}`] ?? season),
  }), [initialTitle, loadedSeasons])
  const loadSeason = useCallback(async (number: number) => {
    setLoadingSeason(number)
    setSeasonError(false)
    try {
      const loaded = await fetchCatalog<Season>(`/api/titles/${initialTitle.id}/seasons/${number}`)
      setLoadedSeasons((current) => ({ ...current, [`${initialTitle.id}:${number}`]: { ...loaded, maturity: initialTitle.maturity } }))
    } catch { setSeasonError(true) }
    finally { setLoadingSeason((current) => current === number ? null : current) }
  }, [initialTitle.id, initialTitle.maturity])
  const router = useRouter()
  const playerRef = useRef<HTMLElement>(null)
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
  const [fullscreen, setFullscreen] = useState(false)

  const revealOverlayControls = useCallback(() => {
    setShowOverlayControls(true)
    if (overlayHideTimer.current) clearTimeout(overlayHideTimer.current)
    overlayHideTimer.current = setTimeout(() => setShowOverlayControls(false), 3000)
  }, [])

  const controlsVisible = showOverlayControls || controlsHovered || providerMenuOpen || episodeMenuOpen

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      playerRef.current?.requestFullscreen?.().catch(() => {})
    } else {
      document.exitFullscreen?.().catch(() => {})
    }
  }, [])

  useEffect(() => {
    const onFullscreenChange = () => setFullscreen(document.fullscreenElement === playerRef.current)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

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
  const [menuSeasonIndex, setMenuSeasonIndex] = useState(target?.seasonIndex ?? 0)

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
  const episodeOptions = useMemo(() => {
    const seasonOption = title.seasons?.[menuSeasonIndex]
    return seasonOption?.episodes.map((episodeOption, nextEpisodeIndex) => ({
      season: seasonOption, episode: episodeOption,
      target: { seasonIndex: menuSeasonIndex, episodeIndex: nextEpisodeIndex },
    })).filter(({ episode }) => isEpisodeReleased(title, seasonOption, episode)) ?? []
  }, [title, menuSeasonIndex])

  const menuSeason = title.seasons?.[menuSeasonIndex]
  useEffect(() => {
    if (episodeMenuOpen && menuSeason && !menuSeason.episodesLoaded) void loadSeason(menuSeason.number)
  }, [episodeMenuOpen, menuSeason?.number, menuSeason?.episodesLoaded, loadSeason])

  // Only the nearest usable season is prefetched at a boundary. Empty seasons
  // can be crossed once their metadata confirms there are no playable episodes.
  const nextPending = season && episodeIndex >= season.episodes.length - 2 ? pendingAdjacentSeason(title, seasonIndex, 1) : null
  const previousPending = episodeIndex <= 1 ? pendingAdjacentSeason(title, seasonIndex, -1) : null
  useEffect(() => {
    if (nextPending !== null) void loadSeason(nextPending)
    if (previousPending !== null) void loadSeason(previousPending)
  }, [nextPending, previousPending, loadSeason])

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
      ref={playerRef}
      className="relative flex h-screen w-screen flex-col overflow-hidden bg-black text-foreground"
      onMouseMove={revealOverlayControls}
      onTouchStart={revealOverlayControls}
    >
      <div
        className={cn(
          'relative z-20 w-full flex-none border-b border-white/10 bg-black/95 p-3 transition-opacity duration-300 sm:p-5',
          controlsVisible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
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
        <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-black/45 p-2 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Back"
            title="Back"
            className="grid size-10 shrink-0 place-items-center rounded-xl text-foreground transition-colors hover:bg-white/10"
          >
            <ArrowLeft className="size-5" />
          </button>

          <DropdownMenu.Root open={providerMenuOpen} onOpenChange={(open) => {
            setProviderMenuOpen(open)
            if (open) revealOverlayControls()
          }}>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                aria-label={`Streaming provider: ${activeProvider.label}`}
                title={activeProvider.label}
                className="flex h-10 items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-3 text-xs font-semibold shadow-lg shadow-black/20 transition-colors hover:border-white/35 hover:bg-white/10"
              >
                <Server className="size-4 text-foreground/80" />
                <span className="hidden sm:inline">Sources</span>
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
                    onSelect={() => switchProvider(provider.id)}
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

          {title.type === 'tv' && (
            <div className="ml-1 flex items-center gap-1 border-l border-white/10 pl-2">
              <button
                type="button"
                onClick={() => goToEpisode(previousTarget)}
                disabled={!previousTarget}
                aria-label="Previous episode"
                title="Previous episode"
                className="grid size-9 place-items-center rounded-xl text-foreground transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <SkipBack className="size-4" />
              </button>
              <DropdownMenu.Root open={episodeMenuOpen} onOpenChange={(open) => {
                setEpisodeMenuOpen(open)
                if (open) { setMenuSeasonIndex(seasonIndex); revealOverlayControls() }
              }}>
                <DropdownMenu.Trigger asChild>
                  <button
                    type="button"
                    aria-label="Select episode"
                    title={`S${season?.number}:E${episode?.number} · ${episode?.title ?? 'Episode'}`}
                    className="grid size-9 place-items-center rounded-xl border border-white/15 bg-white/5 transition-colors hover:bg-white/15"
                  >
                    <ListVideo className="size-4" />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    side="bottom"
                    align="start"
                    sideOffset={8}
                    className="z-[60] max-h-[min(70vh,32rem)] w-72 overflow-y-auto rounded-2xl border border-white/15 bg-black/85 p-1.5 text-foreground shadow-2xl shadow-black/40 backdrop-blur-2xl"
                  >
                    <p className="sticky top-0 z-10 bg-black/85 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground backdrop-blur-2xl">
                      Episodes
                    </p>
                    <select
                      aria-label="Season"
                      value={menuSeasonIndex}
                      onChange={(event) => setMenuSeasonIndex(Number(event.target.value))}
                      className="mb-2 w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm"
                    >
                      {title.seasons?.map((item, index) => <option key={item.number} value={index}>{item.name}</option>)}
                    </select>
                    {loadingSeason === menuSeason?.number && <p role="status" className="px-3 py-2 text-sm">Loading episodes…</p>}
                    {seasonError && <button type="button" className="px-3 py-2 text-sm" onClick={() => menuSeason && void loadSeason(menuSeason.number)}>Retry loading episodes</button>}
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
                className="grid size-9 place-items-center rounded-xl text-foreground transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <SkipForward className="size-4" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            className="ml-auto grid size-10 place-items-center rounded-xl text-foreground transition-colors hover:bg-white/10"
          >
            {fullscreen ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
          </button>
        </div>
      </div>

      <div className="relative order-last min-h-0 flex-1 bg-black">
        <iframe
          ref={iframeRef}
          key={url}
          src={url}
          title={`${title.title} player`}
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          className="absolute inset-0 size-full border-0"
           referrerPolicy="no-referrer"
        />
      </div>
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
