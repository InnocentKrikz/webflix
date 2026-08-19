'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Slider from '@radix-ui/react-slider'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  Cast,
  Check,
  ChevronRight,
  Gauge,
  ListVideo,
  Maximize,
  Minimize,
  Pause,
  Play,
  Rewind,
  Settings,
  SkipForward,
  Subtitles,
  Volume1,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { cn, formatTime, parseDurationToSeconds } from '@/lib/utils'
import type { Episode, Season, Title } from '@/lib/types'

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2]
const QUALITIES = ['Auto', '4K', '1080p', '720p', '480p']

export function VideoPlayer({
  title,
  initialSeason,
  initialEpisode,
}: {
  title: Title
  initialSeason?: number
  initialEpisode?: number
}) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isTV = title.type === 'tv' && Boolean(title.seasons?.length)

  const [seasonIdx, setSeasonIdx] = useState(
    Math.min(Math.max((initialSeason ?? 1) - 1, 0), (title.seasons?.length ?? 1) - 1),
  )
  const season: Season | undefined = title.seasons?.[seasonIdx]
  const [episodeIdx, setEpisodeIdx] = useState(
    Math.min(Math.max((initialEpisode ?? 1) - 1, 0), (season?.episodes.length ?? 1) - 1),
  )
  const episode: Episode | undefined = season?.episodes[episodeIdx]

  const [playing, setPlaying] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [showEpisodes, setShowEpisodes] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [quality, setQuality] = useState('Auto')
  const [dismissedNext, setDismissedNext] = useState(false)
  const [seeking, setSeeking] = useState(false)

  const duration = useMemo(
    () => (isTV && episode ? parseDurationToSeconds(episode.duration) : parseDurationToSeconds(title.runtime)),
    [isTV, episode, title.runtime],
  )

  const backdrop = isTV && episode ? episode.still : title.backdrop

  const nextTarget = useMemo(() => {
    if (!isTV || !title.seasons || !season) return null
    if (episodeIdx + 1 < season.episodes.length) return { s: seasonIdx, e: episodeIdx + 1 }
    if (seasonIdx + 1 < title.seasons.length) return { s: seasonIdx + 1, e: 0 }
    return null
  }, [isTV, title.seasons, season, seasonIdx, episodeIdx])

  const nextEpisode = nextTarget && title.seasons ? title.seasons[nextTarget.s].episodes[nextTarget.e] : null

  const goTo = useCallback((s: number, e: number) => {
    setSeasonIdx(s)
    setEpisodeIdx(e)
    setCurrentTime(0)
    setDismissedNext(false)
    setPlaying(true)
    setShowEpisodes(false)
  }, [])

  const playNext = useCallback(() => {
    if (nextTarget) goTo(nextTarget.s, nextTarget.e)
  }, [nextTarget, goTo])

  // Simulated playback progress
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      setCurrentTime((t) => {
        const next = t + 0.25 * speed
        if (next >= duration) {
          return duration
        }
        return next
      })
    }, 250)
    return () => clearInterval(id)
  }, [playing, duration, speed])

  useEffect(() => {
    if (currentTime >= duration && duration > 0) {
      setPlaying(false)
    }
  }, [currentTime, duration])

  const remaining = duration - currentTime
  const showNextCard = isTV && nextTarget !== null && remaining <= 20 && remaining > 0 && !dismissedNext

  useEffect(() => {
    if (currentTime >= duration && isTV && nextTarget && !dismissedNext) {
      playNext()
    }
  }, [currentTime, duration, isTV, nextTarget, dismissedNext, playNext])

  const resetHideTimer = useCallback(() => {
    setShowControls(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      setShowControls(false)
    }, 3200)
  }, [])

  useEffect(() => {
    resetHideTimer()
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [resetHideTimer])

  useEffect(() => {
    if (!playing) {
      setShowControls(true)
      if (hideTimer.current) clearTimeout(hideTimer.current)
    } else {
      resetHideTimer()
    }
  }, [playing, resetHideTimer])

  const togglePlay = useCallback(() => setPlaying((p) => !p), [])

  const seekBy = useCallback(
    (delta: number) => {
      setCurrentTime((t) => Math.min(duration, Math.max(0, t + delta)))
      resetHideTimer()
    },
    [duration, resetHideTimer],
  )

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {})
    } else {
      document.exitFullscreen?.().catch(() => {})
    }
  }, [])

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement) return
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault()
          togglePlay()
          resetHideTimer()
          break
        case 'ArrowLeft':
          seekBy(-10)
          break
        case 'ArrowRight':
          seekBy(10)
          break
        case 'm':
          setMuted((m) => !m)
          break
        case 'f':
          toggleFullscreen()
          break
        case 'Escape':
          if (showEpisodes) setShowEpisodes(false)
          break
        default:
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [togglePlay, seekBy, toggleFullscreen, showEpisodes, resetHideTimer])

  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2

  return (
    <div
      ref={containerRef}
      className="group relative h-screen w-screen select-none overflow-hidden bg-black text-foreground"
      onMouseMove={resetHideTimer}
      onClick={(e) => {
        if (e.target === e.currentTarget) togglePlay()
      }}
    >
      {/* "video" surface — simulated with backdrop art */}
      <div className="absolute inset-0">
        <Image
          src={backdrop || '/placeholder.svg'}
          alt={title.title}
          fill
          priority
          sizes="100vw"
          className={cn('object-cover transition-transform duration-[8000ms]', playing ? 'scale-105' : 'scale-100')}
        />
        <div className="absolute inset-0 bg-black/25" />
      </div>

      {/* Center play/pause */}
      <AnimatePresence>
        {(!playing || showControls) && (
          <motion.button
            key="center-play"
            onClick={togglePlay}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            aria-label={playing ? 'Pause' : 'Play'}
            className="absolute inset-0 z-10 grid place-items-center"
          >
            <span className="grid size-20 place-items-center rounded-full bg-black/40 ring-1 ring-white/30 backdrop-blur transition-transform hover:scale-110">
              {playing ? (
                <Pause className="size-9 fill-foreground text-foreground" />
              ) : (
                <Play className="size-9 fill-foreground text-foreground" />
              )}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Top bar */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            key="top-bar"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-x-0 top-0 z-20 flex items-center gap-4 bg-gradient-to-b from-black/85 via-black/30 to-transparent p-4 sm:p-6"
          >
            <button
              onClick={() => router.back()}
              aria-label="Back"
              className="grid size-10 shrink-0 place-items-center rounded-full transition-colors hover:bg-white/10"
            >
              <ArrowLeft className="size-6" />
            </button>
            <div className="min-w-0 flex-1 text-center">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                You&apos;re Watching
              </p>
              <p className="truncate font-heading text-sm font-bold sm:text-base">
                {title.title}
                {isTV && season && episode && (
                  <span className="font-normal text-muted-foreground">
                    {' '}
                    — S{season.number}:E{episode.number} {episode.title}
                  </span>
                )}
              </p>
            </div>
            <button
              aria-label="Cast"
              className="grid size-10 shrink-0 place-items-center rounded-full transition-colors hover:bg-white/10"
            >
              <Cast className="size-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Next episode card */}
      <AnimatePresence>
        {showNextCard && nextEpisode && (
          <motion.div
            key="next-card"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="absolute bottom-28 right-4 z-30 w-64 overflow-hidden rounded-lg bg-card shadow-2xl shadow-black/70 ring-1 ring-white/10 sm:right-8 sm:w-80"
          >
            <button onClick={playNext} className="relative block aspect-video w-full">
              <Image src={nextEpisode.still || '/placeholder.svg'} alt={nextEpisode.title} fill sizes="320px" className="object-cover" />
              <span className="absolute inset-0 grid place-items-center bg-black/30">
                <span className="grid size-11 place-items-center rounded-full bg-black/50 ring-1 ring-white/40">
                  <Play className="size-5 fill-foreground text-foreground" />
                </span>
              </span>
            </button>
            <button
              onClick={() => setDismissedNext(true)}
              aria-label="Dismiss"
              className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-black/60 text-foreground"
            >
              <X className="size-4" />
            </button>
            <div className="p-3">
              <p className="text-xs font-semibold text-muted-foreground">Next Episode</p>
              <p className="line-clamp-1 text-sm font-bold">
                {nextEpisode.number}. {nextEpisode.title}
              </p>
              <button
                onClick={playNext}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded bg-foreground py-2 text-sm font-semibold text-background transition-transform hover:scale-[1.02]"
              >
                Play Now
                <span className="text-xs font-normal text-background/70">({Math.ceil(remaining)}s)</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            key="bottom-bar"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-x-0 bottom-0 z-20 space-y-2 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 pt-10 sm:p-6"
          >
            {/* Scrubber */}
            <div className="flex items-center gap-3">
              <span className="w-10 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground sm:w-12 sm:text-xs">
                {formatTime(currentTime)}
              </span>
              <Slider.Root
                value={[currentTime]}
                max={duration || 1}
                step={0.25}
                onValueChange={([v]) => {
                  setSeeking(true)
                  setCurrentTime(v)
                }}
                onValueCommit={() => {
                  setSeeking(false)
                  resetHideTimer()
                }}
                className="relative flex h-4 flex-1 touch-none items-center"
              >
                <Slider.Track className="relative h-1 grow overflow-hidden rounded-full bg-white/25">
                  <Slider.Range className="absolute h-full rounded-full bg-primary" />
                </Slider.Track>
                <Slider.Thumb
                  className={cn(
                    'block size-3.5 rounded-full bg-primary shadow ring-2 ring-white/50 transition-transform focus:outline-none',
                    seeking ? 'scale-125' : 'scale-100',
                  )}
                />
              </Slider.Root>
              <span className="w-10 shrink-0 text-[11px] tabular-nums text-muted-foreground sm:w-12 sm:text-xs">
                {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 sm:gap-3">
                <button
                  onClick={togglePlay}
                  aria-label={playing ? 'Pause' : 'Play'}
                  className="grid size-9 place-items-center rounded-full transition-colors hover:bg-white/10"
                >
                  {playing ? <Pause className="size-5 fill-foreground" /> : <Play className="size-5 fill-foreground" />}
                </button>
                <button
                  onClick={() => seekBy(-10)}
                  aria-label="Rewind 10 seconds"
                  className="grid size-9 place-items-center rounded-full transition-colors hover:bg-white/10"
                >
                  <Rewind className="size-5" />
                </button>
                <button
                  onClick={() => seekBy(10)}
                  aria-label="Forward 10 seconds"
                  className="grid size-9 place-items-center rounded-full transition-colors hover:bg-white/10"
                >
                  <SkipForward className="size-5" />
                </button>

                <div className="group/volume hidden items-center gap-2 sm:flex">
                  <button
                    onClick={() => setMuted((m) => !m)}
                    aria-label={muted ? 'Unmute' : 'Mute'}
                    className="grid size-9 place-items-center rounded-full transition-colors hover:bg-white/10"
                  >
                    <VolumeIcon className="size-5" />
                  </button>
                  <Slider.Root
                    value={[muted ? 0 : volume]}
                    max={1}
                    step={0.01}
                    onValueChange={([v]) => {
                      setVolume(v)
                      setMuted(v === 0)
                    }}
                    className="relative flex h-4 w-0 items-center overflow-hidden transition-all duration-300 group-hover/volume:w-20"
                  >
                    <Slider.Track className="relative h-1 grow rounded-full bg-white/25">
                      <Slider.Range className="absolute h-full rounded-full bg-foreground" />
                    </Slider.Track>
                    <Slider.Thumb className="block size-3 rounded-full bg-foreground focus:outline-none" />
                  </Slider.Root>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                {isTV && nextTarget && (
                  <button
                    onClick={playNext}
                    className="hidden items-center gap-1.5 rounded-full border border-white/25 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-white/10 sm:flex"
                  >
                    Next Episode
                    <SkipForward className="size-3.5" />
                  </button>
                )}

                <button
                  aria-label="Subtitles"
                  className="grid size-9 place-items-center rounded-full transition-colors hover:bg-white/10"
                >
                  <Subtitles className="size-5" />
                </button>

                {isTV && (
                  <button
                    onClick={() => setShowEpisodes(true)}
                    aria-label="Episodes"
                    className="grid size-9 place-items-center rounded-full transition-colors hover:bg-white/10"
                  >
                    <ListVideo className="size-5" />
                  </button>
                )}

                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button aria-label="Settings" className="grid size-9 place-items-center rounded-full transition-colors hover:bg-white/10">
                      <Settings className="size-5" />
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      side="top"
                      align="end"
                      sideOffset={12}
                      className="z-[60] w-52 rounded-xl border border-white/10 bg-popover/95 p-1.5 shadow-2xl backdrop-blur-xl"
                    >
                      <p className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <Gauge className="size-3.5" /> Playback speed
                      </p>
                      {SPEEDS.map((s) => (
                        <DropdownMenu.Item
                          key={s}
                          onSelect={() => setSpeed(s)}
                          className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-white/10"
                        >
                          {s}x
                          {speed === s && <Check className="size-4 text-primary" />}
                        </DropdownMenu.Item>
                      ))}
                      <DropdownMenu.Separator className="my-1 h-px bg-white/10" />
                      <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quality</p>
                      {QUALITIES.map((q) => (
                        <DropdownMenu.Item
                          key={q}
                          onSelect={() => setQuality(q)}
                          className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-white/10"
                        >
                          {q}
                          {quality === q && <Check className="size-4 text-primary" />}
                        </DropdownMenu.Item>
                      ))}
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>

                <button
                  onClick={toggleFullscreen}
                  aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                  className="grid size-9 place-items-center rounded-full transition-colors hover:bg-white/10"
                >
                  {fullscreen ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Episodes drawer */}
      <Dialog.Root open={showEpisodes} onOpenChange={setShowEpisodes}>
        <AnimatePresence>
          {showEpisodes && title.seasons && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild forceMount>
                <motion.div
                  className="fixed inset-0 z-40 bg-black/60"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              </Dialog.Overlay>
              <Dialog.Content asChild forceMount aria-describedby={undefined}>
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', stiffness: 320, damping: 34 }}
                  className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-card ring-1 ring-white/10"
                >
                  <div className="flex items-center justify-between border-b border-white/10 p-4">
                    <Dialog.Title className="font-heading text-lg font-bold">Episodes</Dialog.Title>
                    <Dialog.Close aria-label="Close" className="grid size-9 place-items-center rounded-full hover:bg-white/10">
                      <X className="size-5" />
                    </Dialog.Close>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto border-b border-white/10 p-3">
                    {title.seasons.map((s, i) => (
                      <button
                        key={s.number}
                        onClick={() => {
                          setSeasonIdx(i)
                          setEpisodeIdx(0)
                        }}
                        className={cn(
                          'shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                          i === seasonIdx ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground hover:text-foreground',
                        )}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>

                  <div className="flex-1 overflow-y-auto p-3">
                    {title.seasons[seasonIdx].episodes.map((ep, i) => {
                      const active = i === episodeIdx
                      return (
                        <button
                          key={ep.id}
                          onClick={() => goTo(seasonIdx, i)}
                          className={cn(
                            'mb-2 flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-white/5',
                            active && 'bg-white/10',
                          )}
                        >
                          <span className="w-5 shrink-0 text-center text-sm font-semibold text-muted-foreground">{ep.number}</span>
                          <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-md">
                            <Image src={ep.still || '/placeholder.svg'} alt={ep.title} fill sizes="96px" className="object-cover" />
                            {active && (
                              <span className="absolute inset-0 grid place-items-center bg-black/40">
                                <Play className="size-4 fill-foreground text-foreground" />
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-1 text-sm font-semibold">{ep.title}</p>
                            <p className="line-clamp-2 text-xs text-muted-foreground">{ep.description}</p>
                          </div>
                          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
    </div>
  )
}
