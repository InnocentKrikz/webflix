'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ListVideo,
  Maximize,
  MoreHorizontal,
  Pause,
  Play,
  Server,
  Settings,
  SkipBack,
  SkipForward,
  Subtitles,
  Volume2,
  VolumeX,
} from 'lucide-react'

const CONTROLS_TIMEOUT = 4200

const PREVIEW_SERVERS = [
  { id: 'sceneflix-1', label: 'Sceneflix 1', detail: 'Recommended', badge: 'HD' },
  { id: 'sceneflix-2', label: 'Sceneflix 2', detail: 'Fast fallback', badge: 'HD' },
  { id: 'sceneflix-3', label: 'Sceneflix 3', detail: 'Low latency', badge: '1080p' },
] as const

const PREVIEW_SEASONS = [
  {
    number: 1,
    episodes: [
      { number: 1, title: 'Afterglow', duration: '52m' },
      { number: 2, title: 'False Horizon', duration: '46m' },
      { number: 3, title: 'The Descent', duration: '49m' },
      { number: 4, title: 'Second Sun', duration: '51m' },
      { number: 5, title: 'The Last Quiet', duration: '44m' },
    ],
  },
  {
    number: 2,
    episodes: [
      { number: 1, title: 'The Return', duration: '54m' },
      { number: 2, title: 'Through the Glass', duration: '48m' },
      { number: 3, title: 'A New Signal', duration: '50m' },
    ],
  },
] as const

const QUALITY_OPTIONS = ['Auto', '1080p', '720p', '480p'] as const
const SPEED_OPTIONS = ['0.75x', '1x', '1.25x', '1.5x'] as const

type HlsInstance = {
  loadSource(source: string): void
  attachMedia(media: HTMLVideoElement): void
  destroy(): void
}

type HlsConstructor = {
  new (config?: Record<string, unknown>): HlsInstance
  isSupported(): boolean
}

declare global {
  interface Window { Hls?: HlsConstructor }
}

let hlsLoader: Promise<HlsConstructor> | null = null

function loadHls() {
  if (window.Hls) return Promise.resolve(window.Hls)
  if (!hlsLoader) {
    hlsLoader = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.6.15/dist/hls.min.js'
      script.async = true
      script.onload = () => window.Hls ? resolve(window.Hls) : reject(new Error('HLS player did not load'))
      script.onerror = () => reject(new Error('Unable to load the HLS player'))
      document.head.append(script)
    })
  }
  return hlsLoader
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const remainder = total % 60
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}` : `${minutes}:${String(remainder).padStart(2, '0')}`
}

export function NativePlayerPreview({ movieId }: { movieId?: string }) {
  const router = useRouter()
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [showOptions, setShowOptions] = useState(false)
  const [showServers, setShowServers] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showEpisodes, setShowEpisodes] = useState(false)
  const [showVolume, setShowVolume] = useState(false)
  const [activeServer, setActiveServer] = useState<(typeof PREVIEW_SERVERS)[number]['id']>('sceneflix-1')
  const [activeSeason, setActiveSeason] = useState(1)
  const [activeEpisode, setActiveEpisode] = useState(3)
  const [quality, setQuality] = useState<(typeof QUALITY_OPTIONS)[number]>('Auto')
  const [speed, setSpeed] = useState<(typeof SPEED_OPTIONS)[number]>('1x')
  const [volume, setVolume] = useState(72)
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [connectionState, setConnectionState] = useState<'waiting' | 'ready' | 'error'>(movieId ? 'waiting' : 'ready')
  const [connectionMessage, setConnectionMessage] = useState('')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [bufferedPercent, setBufferedPercent] = useState(0)
  const currentSeason = PREVIEW_SEASONS.find((season) => season.number === activeSeason) ?? PREVIEW_SEASONS[0]
  const currentEpisode = currentSeason.episodes.find((episode) => episode.number === activeEpisode) ?? currentSeason.episodes[0]

  const hideLater = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      setControlsVisible(false)
      setShowOptions(false)
      setShowServers(false)
      setShowSettings(false)
      setShowEpisodes(false)
      setShowVolume(false)
    }, CONTROLS_TIMEOUT)
  }, [])

  const revealControls = useCallback(() => {
    setControlsVisible(true)
    hideLater()
  }, [hideLater])

  useEffect(() => {
    hideLater()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === ' ') {
        event.preventDefault()
        const video = videoRef.current
        if (movieId && video) {
          if (video.paused) void video.play().catch(() => setConnectionMessage('Playback could not start. Check that the extension source is still valid.'))
          else video.pause()
        } else {
          setPlaying((value) => !value)
        }
        revealControls()
      }
      if (event.key === 'Escape') router.back()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [hideLater, revealControls, router])

  useEffect(() => {
    if (!movieId) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/backend/playback/${encodeURIComponent(movieId)}/status`, { cache: 'no-store' })
        if (!response.ok) throw new Error('The playback service is unavailable')
        const status = await response.json() as { state?: string; updatedAt?: string }
        if (cancelled) return
        if (status.state === 'ready') {
          setConnectionState('ready')
          setConnectionMessage('')
          setMediaUrl((current) => current ?? `/api/backend/playback/${encodeURIComponent(movieId)}/manifest.m3u8?v=${encodeURIComponent(status.updatedAt ?? String(Date.now()))}`)
          return
        }
        setConnectionState('waiting')
        timer = setTimeout(checkStatus, 2_500)
      } catch {
        if (!cancelled) {
          setConnectionState('error')
          setConnectionMessage('Waiting for the playback service. Retrying…')
          timer = setTimeout(checkStatus, 5_000)
        }
      }
    }
    void checkStatus()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [movieId])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !mediaUrl) return
    let hls: HlsInstance | undefined
    let cancelled = false
    const connect = async () => {
      video.volume = volume / 100
      video.muted = muted
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = mediaUrl
        return
      }
      try {
        const Hls = await loadHls()
        if (cancelled) return
        if (!Hls.isSupported()) throw new Error('This browser cannot play HLS video')
        hls = new Hls({ enableWorker: true })
        hls.loadSource(mediaUrl)
        hls.attachMedia(video)
      } catch (error) {
        if (!cancelled) {
          setConnectionState('error')
          setConnectionMessage(error instanceof Error ? error.message : 'Unable to start HLS playback')
        }
      }
    }
    void connect()
    return () => {
      cancelled = true
      hls?.destroy()
      video.removeAttribute('src')
      video.load()
    }
  }, [mediaUrl])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume / 100
      videoRef.current.muted = muted
    }
  }, [muted, volume])

  function togglePlaying() {
    const video = videoRef.current
    if (movieId && video) {
      if (video.paused) void video.play().catch(() => setConnectionMessage('Playback could not start. Check that the extension source is still valid.'))
      else video.pause()
    } else {
      setPlaying((value) => !value)
    }
    revealControls()
  }

  return (
    <main
      className="relative h-[100dvh] min-h-[32rem] overflow-hidden bg-black text-white selection:bg-primary/70"
      onMouseMove={revealControls}
      onClick={(event) => {
        if (event.target === event.currentTarget) togglePlaying()
      }}
    >
      <Image
        src="/images/vanta-landscape.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      {mediaUrl && (
        <video
          ref={videoRef}
          className="absolute inset-0 size-full object-contain"
          playsInline
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
          onDurationChange={(event) => setDuration(event.currentTarget.duration)}
          onTimeUpdate={(event) => {
            const video = event.currentTarget
            setCurrentTime(video.currentTime)
            const end = video.buffered.length ? video.buffered.end(video.buffered.length - 1) : 0
            setBufferedPercent(video.duration ? Math.min(100, (end / video.duration) * 100) : 0)
          }}
          onError={() => setConnectionMessage('The stream could not be loaded. The extension can submit a refreshed manifest.')}
        />
      )}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_21%,rgba(0,0,0,0.16)_58%,rgba(0,0,0,0.82)_100%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-transparent via-40% to-black/95" />

      {!playing && (!movieId || mediaUrl) && (
        <button
          type="button"
          onClick={togglePlaying}
          aria-label="Play preview"
          className="absolute left-1/2 top-1/2 z-10 grid size-[76px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-black shadow-2xl transition hover:scale-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/70 sm:size-[92px]"
        >
          <Play className="ml-1 size-8 fill-current sm:size-10" />
        </button>
      )}

      {movieId && !mediaUrl && (
        <div className="absolute left-1/2 top-1/2 z-10 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/15 bg-black/65 p-6 text-center shadow-2xl backdrop-blur-md">
          <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-2 border-white/25 border-t-white" />
          <p className="text-base font-semibold">Waiting for your HLS source</p>
          <p className="mt-2 text-sm leading-6 text-white/65">Open HLS Vault, enter movie ID <span className="font-mono text-white">{movieId}</span>, and send a detected M3U8 playlist to Webflix.</p>
          {connectionState === 'error' && <p className="mt-3 text-xs text-amber-200">{connectionMessage}</p>}
        </div>
      )}

      <div
        className={`absolute inset-0 z-20 transition-opacity duration-300 ${controlsVisible ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b from-black/80 to-transparent px-4 pb-20 pt-5 sm:px-8 sm:pt-7 lg:px-12">
          <div className="flex min-w-0 items-center gap-4 sm:gap-6">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Exit player preview"
              className="grid size-10 shrink-0 place-items-center rounded-full transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ArrowLeft className="size-7" />
            </button>
            <div className="min-w-0 text-sm font-medium text-white/85 sm:text-base">
              <span className="font-semibold text-white">Vanta</span>
              <span className="mx-2 text-white/50">·</span>
              <span className="truncate">S{activeSeason}:E{currentEpisode.number} “{currentEpisode.title}”</span>
            </div>
          </div>
          <button
            type="button"
            onClick={revealControls}
            aria-label="More player actions"
            className="grid size-10 place-items-center rounded-full transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <MoreHorizontal className="size-6" />
          </button>
        </header>

        <section className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent px-4 pb-[max(1.15rem,env(safe-area-inset-bottom))] pt-24 sm:px-8 sm:pb-7 lg:px-12">
          <div className="group relative mb-4 h-4 cursor-pointer py-1.5 sm:mb-5" aria-label="Playback progress" onClick={(event) => {
            const video = videoRef.current
            if (!movieId || !video || !duration) return
            const bounds = event.currentTarget.getBoundingClientRect()
            video.currentTime = Math.max(0, Math.min(duration, ((event.clientX - bounds.left) / bounds.width) * duration))
          }}>
            <div className="relative h-1 w-full overflow-visible rounded-full bg-white/25 transition group-hover:h-1.5">
              <div className="absolute inset-y-0 left-0 rounded-full bg-slate-100/65" style={{ width: `${movieId ? bufferedPercent : 76}%` }} aria-label="Buffered download progress" />
              <div className="relative h-full rounded-full bg-primary" style={{ width: `${movieId && duration ? (currentTime / duration) * 100 : 38}%` }}>
                <span className="absolute right-0 top-1/2 size-3 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary opacity-0 shadow-[0_0_12px_rgba(230,34,50,0.9)] transition group-hover:opacity-100" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <button type="button" onClick={togglePlaying} aria-label={playing ? 'Pause preview' : 'Play preview'} className="transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              {playing ? <Pause className="size-6 fill-current sm:size-7" /> : <Play className="size-6 fill-current sm:size-7" />}
            </button>
            <button type="button" onClick={revealControls} aria-label="Previous episode" className="hidden transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:block"><SkipBack className="size-6 fill-current" /></button>
            <button type="button" onClick={revealControls} aria-label="Next episode" className="hidden transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:block"><SkipForward className="size-6 fill-current" /></button>
            <div className="relative" onMouseEnter={() => setShowVolume(true)} onMouseLeave={() => setShowVolume(false)}>
              <button type="button" onClick={() => setMuted((value) => { const next = !value; if (videoRef.current) videoRef.current.muted = next; return next })} aria-label={muted ? 'Unmute preview' : 'Mute preview'} className="grid size-8 place-items-center rounded-full transition hover:bg-white/15 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:size-9">
                {muted || volume === 0 ? <VolumeX className="size-6 sm:size-7" /> : <Volume2 className="size-6 sm:size-7" />}
              </button>
              <div className={`absolute bottom-0 left-full flex h-9 origin-left items-center overflow-hidden rounded-full bg-black/75 pl-1 backdrop-blur-sm transition-all duration-200 ${showVolume ? 'ml-1 w-24 opacity-100' : 'ml-0 w-0 opacity-0'}`}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={muted ? 0 : volume}
                  onChange={(event) => { const next = Number(event.target.value); setVolume(next); setMuted(false); if (videoRef.current) { videoRef.current.volume = next / 100; videoRef.current.muted = false }; revealControls() }}
                  aria-label="Volume"
                  className="h-1 w-[76px] cursor-pointer accent-primary"
                />
              </div>
            </div>
            <span className="hidden whitespace-nowrap text-sm font-medium text-white/90 md:block">{movieId ? formatTime(currentTime) : '18:42'} <span className="text-white/60">/</span> {movieId ? formatTime(duration) : '49:18'}</span>

            <div className="ml-auto flex items-center gap-2 sm:gap-4">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowServers((value) => !value)
                    setShowOptions(false)
                    setShowSettings(false)
                    setShowEpisodes(false)
                    revealControls()
                  }}
                  aria-label="Choose playback server"
                  aria-expanded={showServers}
                  className={`flex h-9 items-center gap-2 rounded px-2.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:h-10 sm:px-3 sm:text-sm ${showServers ? 'bg-white text-black' : 'hover:bg-white/15'}`}
                >
                  <Server className="size-4 sm:size-5" />
                  <span className="hidden sm:inline">Servers</span>
                  <ChevronDown className={`size-3.5 transition-transform ${showServers ? 'rotate-180' : ''}`} />
                </button>
                {showServers && (
                  <div className="absolute bottom-12 right-0 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-md bg-[#141414]/95 shadow-2xl ring-1 ring-white/20 backdrop-blur-md sm:bottom-14">
                    <div className="border-b border-white/10 px-4 py-3">
                      <p className="text-sm font-semibold text-white">Choose a server</p>
                      <p className="mt-0.5 text-xs text-white/55">If playback has an issue, try another server.</p>
                    </div>
                    <div className="p-1.5">
                      {PREVIEW_SERVERS.map((server) => {
                        const selected = activeServer === server.id
                        return (
                          <button
                            type="button"
                            key={server.id}
                            onClick={() => {
                              setActiveServer(server.id)
                              setShowServers(false)
                              revealControls()
                            }}
                            className={`flex w-full items-center gap-3 rounded px-3 py-3 text-left transition ${selected ? 'bg-white/15' : 'hover:bg-white/10'}`}
                          >
                            <span className={`size-2 shrink-0 rounded-full ${selected ? 'bg-primary shadow-[0_0_10px_rgba(230,34,50,0.95)]' : 'bg-emerald-400'}`} />
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-semibold text-white">{server.label}</span>
                              <span className="mt-0.5 block text-xs text-white/55">{server.detail}</span>
                            </span>
                            <span className="rounded border border-white/15 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white/70">{server.badge}</span>
                            {selected && <Check className="size-4 text-white" />}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setShowOptions((value) => !value); setShowServers(false); setShowSettings(false); setShowEpisodes(false); revealControls() }}
                  aria-label="Audio and subtitle options"
                  aria-expanded={showOptions}
                  className="grid size-9 place-items-center rounded-full transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:size-10"
                >
                  <Subtitles className="size-5 sm:size-6" />
                </button>
                {showOptions && (
                  <div className="absolute bottom-12 right-0 w-64 rounded-md bg-black/90 p-4 shadow-2xl ring-1 ring-white/20 backdrop-blur-sm sm:bottom-14">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/55">Audio</p>
                    <button type="button" className="flex w-full items-center justify-between rounded px-2 py-2 text-left text-sm hover:bg-white/10"><span>English — Original</span><Check className="size-4" /></button>
                    <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-white/55">Subtitles</p>
                    <button type="button" className="flex w-full items-center justify-between rounded px-2 py-2 text-left text-sm hover:bg-white/10"><span>English</span><Check className="size-4" /></button>
                  </div>
                )}
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setShowEpisodes((value) => !value); setShowServers(false); setShowOptions(false); setShowSettings(false); revealControls() }}
                  aria-label="Episodes and seasons"
                  aria-expanded={showEpisodes}
                  className={`hidden size-10 place-items-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:grid ${showEpisodes ? 'bg-white text-black' : 'hover:bg-white/15'}`}
                >
                  <ListVideo className="size-6" />
                </button>
                {showEpisodes && (
                  <div className="absolute bottom-14 right-0 w-80 overflow-hidden rounded-md bg-[#141414]/95 shadow-2xl ring-1 ring-white/20 backdrop-blur-md">
                    <div className="border-b border-white/10 px-4 py-3"><p className="text-sm font-semibold">Episodes</p></div>
                    <div className="flex gap-2 border-b border-white/10 px-4 py-3">
                      {PREVIEW_SEASONS.map((season) => (
                        <button key={season.number} type="button" onClick={() => { setActiveSeason(season.number); setActiveEpisode(season.episodes[0].number); revealControls() }} className={`rounded px-3 py-1.5 text-xs font-semibold transition ${season.number === activeSeason ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}>Season {season.number}</button>
                      ))}
                    </div>
                    <div className="max-h-64 overflow-y-auto p-1.5">
                      {currentSeason.episodes.map((episode) => {
                        const selected = activeEpisode === episode.number
                        return <button key={episode.number} type="button" onClick={() => { setActiveEpisode(episode.number); setShowEpisodes(false); revealControls() }} className={`flex w-full items-center gap-3 rounded px-3 py-2.5 text-left transition ${selected ? 'bg-white/15' : 'hover:bg-white/10'}`}><span className={`grid size-7 shrink-0 place-items-center rounded text-xs font-bold ${selected ? 'bg-primary text-white' : 'bg-white/10 text-white/70'}`}>{selected ? <Play className="size-3 fill-current" /> : episode.number}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{episode.title}</span><span className="mt-0.5 block text-xs text-white/55">Episode {episode.number}</span></span><span className="text-xs text-white/55">{episode.duration}</span></button>
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setShowSettings((value) => !value); setShowServers(false); setShowOptions(false); setShowEpisodes(false); revealControls() }}
                  aria-label="Player settings"
                  aria-expanded={showSettings}
                  className={`grid size-9 place-items-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:size-10 ${showSettings ? 'bg-white text-black' : 'hover:bg-white/15'}`}
                ><Settings className="size-5 sm:size-6" /></button>
                {showSettings && (
                  <div className="absolute bottom-12 right-0 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-md bg-[#141414]/95 shadow-2xl ring-1 ring-white/20 backdrop-blur-md sm:bottom-14">
                    <div className="border-b border-white/10 px-4 py-3"><p className="text-sm font-semibold">Playback settings</p></div>
                    <div className="border-b border-white/10 px-4 py-3"><p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/55">Quality</p><div className="grid grid-cols-2 gap-1.5">{QUALITY_OPTIONS.map((option) => <button type="button" key={option} onClick={() => { setQuality(option); revealControls() }} className={`rounded px-3 py-2 text-sm font-medium transition ${quality === option ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20'}`}>{option}</button>)}</div></div>
                    <div className="px-4 py-3"><p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/55">Playback speed</p><div className="grid grid-cols-4 gap-1.5">{SPEED_OPTIONS.map((option) => <button type="button" key={option} onClick={() => { setSpeed(option); revealControls() }} className={`rounded px-2 py-2 text-xs font-semibold transition ${speed === option ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20'}`}>{option}</button>)}</div></div>
                  </div>
                )}
              </div>
              <button type="button" onClick={() => { void document.documentElement.requestFullscreen?.(); revealControls() }} aria-label="Fullscreen" className="transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><Maximize className="size-6 sm:size-7" /></button>
            </div>
          </div>
        </section>
      </div>

      {!movieId && <div className="pointer-events-none absolute bottom-[6.5rem] right-4 z-10 hidden rounded bg-black/55 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.13em] text-white/55 backdrop-blur-sm sm:block">visual design preview</div>}
    </main>
  )
}
