'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Select from '@radix-ui/react-select'
import * as Switch from '@radix-ui/react-switch'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Check,
  ChevronDown,
  Eye,
  Lock,
  LoaderCircle,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Plus,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { useCatalog, useEffects, useModal, useModalState, useMyList } from '@/components/providers'
import { LandscapeCard } from '@/components/media-card'
import { MediaGlowBoundary } from '@/components/media-card-glow'
import { MatchScore } from '@/components/match-score'
import { RatingButton } from '@/components/rating-button'
import { TrailerAmbientGlow, useTrailerAmbient } from '@/components/trailer-ambient'
import { YouTubeTrailer, type YouTubeTrailerHandle } from '@/components/youtube-trailer'
import { cn } from '@/lib/utils'
import { isEpisodeReleased, isSeasonReleased, isTitleReleased } from '@/lib/availability'
import { getTitleViewStats } from '@/lib/viewer-client'
import type { Title, Season } from '@/lib/types'
import { fetchCatalog } from '@/lib/catalog-client'

function watchHref(title: Title) {
  const progress = title.watchProgress
  if (!progress) return `/watch/${title.slug}`
  const params = title.type === 'tv' && progress.seasonNumber && progress.episodeNumber
    ? `?s=${progress.seasonNumber}&e=${progress.episodeNumber}`
    : ''
  return `/watch/${title.slug}${params}`
}

function EpisodeRow({
  episode,
  spoilerProtected,
  available,
  onPlay,
}: {
  episode: NonNullable<Title['seasons']>[number]['episodes'][number]
  spoilerProtected: boolean
  available: boolean
  onPlay: () => void
}) {
  const [revealed, setRevealed] = useState(false)
  const hidden = available && spoilerProtected && !revealed

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 border-b border-white/5 py-4 last:border-b-0"
    >
      <span className="w-5 shrink-0 text-center text-lg font-semibold text-muted-foreground">
        {episode.number}
      </span>
      <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-md sm:w-40">
        <Image
          src={episode.still || '/placeholder.svg'}
          alt={episode.title}
          fill
          sizes="160px"
          className={cn('object-cover transition-all duration-300', hidden && 'blur-md scale-105')}
        />
        {!hidden && available && (
          <button
            type="button"
            onClick={onPlay}
            aria-label={`Play ${episode.title}`}
            className="absolute inset-0 grid place-items-center bg-black/0 opacity-0 transition-opacity hover:bg-black/40 hover:opacity-100"
          >
            <Play className="size-6 fill-foreground text-foreground" />
          </button>
        )}
        {hidden && (
          <button
            onClick={() => setRevealed(true)}
            className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50 text-[11px] font-semibold uppercase tracking-wide text-foreground"
          >
            <Lock className="size-4 text-primary" />
            Tap to reveal
          </button>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className={cn('truncate text-sm font-semibold', hidden && 'select-none blur-sm')}>
            {hidden ? 'Hidden episode title' : episode.title}
          </p>
          <span className={cn('shrink-0 text-xs', available ? 'text-muted-foreground' : 'font-semibold text-primary')}>
            {available ? episode.duration : 'Coming Soon'}
          </span>
        </div>
        <p className={cn('mt-1 line-clamp-2 text-xs text-muted-foreground', hidden && 'select-none blur-sm')}>
          {hidden ? 'Spoiler protection is on. Reveal the thumbnail to see details for this episode.' : episode.description}
        </p>
      </div>
    </motion.li>
  )
}

export function DetailModal() {
  const { close, open } = useModal()
  const openId = useModalState()
  const { getTitle, registerTitles } = useCatalog()
  const { reducedEffects } = useEffects()
  const router = useRouter()
  const { has, toggle } = useMyList()
  const [muted, setMuted] = useState(true)
  const [spoilerProtected, setSpoilerProtected] = useState(true)
  const [seasonIdx, setSeasonIdx] = useState(0)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [detailTitle, setDetailTitle] = useState<Title | null>(null)
  const [trailerLoaded, setTrailerLoaded] = useState(false)
  const [trailerPlaying, setTrailerPlaying] = useState(false)
  const [trailerHovered, setTrailerHovered] = useState(false)
  const [trailerControlsVisible, setTrailerControlsVisible] = useState(false)
  const [failedTrailer, setFailedTrailer] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [relatedTitles, setRelatedTitles] = useState<Title[]>([])
  const [seasonLoading, setSeasonLoading] = useState(false)
  const [viewCount, setViewCount] = useState<number | null>(null)
  const trailerPlayerRef = useRef<YouTubeTrailerHandle>(null)
  const trailerIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const modalScrollRef = useRef<HTMLDivElement>(null)
  const requestedDetails = useRef(new Set<string>())

  const catalogTitle = openId ? getTitle(openId) : undefined
  const title = openId && detailTitle?.id === openId
    ? {
        ...detailTitle,
        watchProgress: detailTitle.watchProgress ?? catalogTitle?.watchProgress,
      }
    : catalogTitle
  const isUpcoming = title ? !isTitleReleased(title) : false
  const detailsLoading = loadingId === openId

  useEffect(() => {
    if (!openId || requestedDetails.current.has(openId) || catalogTitle?.detailsLoaded) return

    const detailId = openId
    requestedDetails.current.add(detailId)
    const controller = new AbortController()
    setLoadingId(detailId)

    fetchCatalog<Title>(`/api/titles/${detailId}`, controller.signal)
      .then((detail: Title | undefined) => {
        if (controller.signal.aborted) return
        if (detail) {
          const detailWithProgress = catalogTitle?.watchProgress
            ? { ...detail, watchProgress: catalogTitle.watchProgress }
            : detail
          setDetailTitle(detailWithProgress)
          registerTitles([detailWithProgress])
        } else {
          requestedDetails.current.delete(detailId)
        }
      })
      .catch(() => {
        requestedDetails.current.delete(detailId)
      })
      .finally(() => {
        setLoadingId((current) => (current === detailId ? null : current))
      })

    return () => controller.abort()
  }, [catalogTitle?.detailsLoaded, openId, registerTitles])

  const similar = useMemo(() => {
    if (relatedTitles.length) return relatedTitles.slice(0, 6)
    if (!title) return []
    return title.similar.map(getTitle).filter((t): t is Title => Boolean(t)).slice(0, 6)
  }, [title, relatedTitles, getTitle])

  useEffect(() => {
    if (!openId) return
    const controller = new AbortController()
    setRelatedTitles([])
    void fetchCatalog<Title[]>(`/api/titles/${openId}/related`, controller.signal)
      .then((items) => { if (!controller.signal.aborted) { setRelatedTitles(items); registerTitles(items) } })
      .catch(() => {})
    return () => controller.abort()
  }, [openId, registerTitles])

  useEffect(() => {
    if (!openId) return
    const [type, id] = openId.split('-')
    const timer = setTimeout(() => {
      void fetch('/api/backend/sync/item', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaType: type === 'tv' ? 'TV' : 'MOVIE', tmdbId: Number(id), background: true }),
      }).catch(() => {})
    }, 1500)
    return () => clearTimeout(timer)
  }, [openId])

  const trailers = useMemo(
    () => [...(title?.trailers ?? [])].sort((a, b) => Number(b.kind === 'Trailer') - Number(a.kind === 'Trailer')),
    [title?.trailers],
  )
  const trailer = trailers.find((item) => item.videoKey)
  const trailerKey = `${openId}:${trailer?.videoKey ?? ''}`
  const hasTrailer = Boolean(trailer?.videoKey?.trim()) && failedTrailer !== trailerKey
  const { sample: ambientSample, onTimeUpdate } = useTrailerAmbient(trailer?.timeline)

  useEffect(() => {
    if (!openId) return
    setTrailerLoaded(false)
    setTrailerPlaying(hasTrailer)
    setTrailerHovered(false)
    setTrailerControlsVisible(false)
    setExpanded(false)
  }, [openId, trailer?.videoKey, hasTrailer])

  useEffect(() => {
    if (!openId) return
    setSeasonIdx(0)
    modalScrollRef.current?.scrollTo({
      top: 0,
      behavior: reducedEffects ? 'auto' : 'smooth',
    })
  }, [openId, reducedEffects])

  useEffect(() => {
    if (!openId) {
      setViewCount(null)
      return
    }

    let cancelled = false
    setViewCount(null)
    void getTitleViewStats(openId)
      .then((stats) => {
        if (!cancelled) setViewCount(stats.viewCount)
      })
      .catch(() => {
        if (!cancelled) setViewCount(null)
      })
    return () => {
      cancelled = true
    }
  }, [openId])

  const season = title?.seasons?.[seasonIdx] ?? title?.seasons?.[0]

  useEffect(() => {
    if (!title || !title.detailsLoaded || title.type !== 'tv' || !season || season.episodesLoaded) { setSeasonLoading(false); return }
    const controller = new AbortController()
    setSeasonLoading(true)
    void fetchCatalog<Season>(`/api/titles/${title.id}/seasons/${season.number}`, controller.signal)
      .then((loaded) => {
        if (controller.signal.aborted) return
        setDetailTitle((current) => {
          const source = current?.id === title.id ? current : title
          return { ...source, seasons: source.seasons?.map((item) => item.number === loaded.number ? loaded : item) }
        })
      }).catch(() => {}).finally(() => { if (!controller.signal.aborted) setSeasonLoading(false) })
    return () => controller.abort()
  }, [title?.id, title?.detailsLoaded, season?.number, season?.episodesLoaded])

  function onOpenChange(open: boolean) {
    if (!open) {
      close()
      setDetailTitle(null)
      setSeasonIdx(0)
      setMuted(true)
      setTrailerLoaded(false)
      setTrailerPlaying(false)
      setTrailerHovered(false)
      setTrailerControlsVisible(false)
      setExpanded(false)
    }
  }

  function onTrailerEnded() {
    setTrailerPlaying(false)
    setTrailerLoaded(false)
    setTrailerHovered(false)
    setTrailerControlsVisible(false)
    if (trailerIdleTimerRef.current) {
      clearTimeout(trailerIdleTimerRef.current)
      trailerIdleTimerRef.current = null
    }
  }

  function handleTrailerPointerActivity() {
    setTrailerHovered(true)
    setTrailerControlsVisible(true)

    if (!expanded || !trailerPlaying) return
    if (trailerIdleTimerRef.current) clearTimeout(trailerIdleTimerRef.current)
    trailerIdleTimerRef.current = setTimeout(() => {
      setTrailerControlsVisible(false)
      trailerIdleTimerRef.current = null
    }, 2400)
  }

  function handleTrailerPointerLeave() {
    setTrailerHovered(false)
    setTrailerControlsVisible(false)
    if (trailerIdleTimerRef.current) {
      clearTimeout(trailerIdleTimerRef.current)
      trailerIdleTimerRef.current = null
    }
  }

  useEffect(() => {
    if (!expanded || !trailerPlaying || !trailerHovered) return
    if (trailerIdleTimerRef.current) clearTimeout(trailerIdleTimerRef.current)
    trailerIdleTimerRef.current = setTimeout(() => {
      setTrailerControlsVisible(false)
      trailerIdleTimerRef.current = null
    }, 2400)

    return () => {
      if (trailerIdleTimerRef.current) {
        clearTimeout(trailerIdleTimerRef.current)
        trailerIdleTimerRef.current = null
      }
    }
  }, [expanded, trailerHovered, trailerPlaying])

  return (
    <Dialog.Root open={Boolean(openId)} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {title && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              />
            </Dialog.Overlay>

            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              <motion.div
                ref={modalScrollRef}
                className={cn('fixed inset-0 z-[90] overflow-y-auto', expanded ? 'py-0' : 'py-6 md:py-12')}
                onPointerDown={(event) => {
                  if (event.target === event.currentTarget) onOpenChange(false)
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.92, y: 24 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 12 }}
                  transition={{
                    type: 'spring',
                    stiffness: 280,
                    damping: 28,
                    layout: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
                    opacity: { duration: 0.2 },
                    scale: { duration: 0.25 },
                  }}
                  className={cn(
                    'relative mx-auto overflow-hidden bg-card shadow-2xl shadow-black/80 ring-1 ring-white/10',
                    expanded ? 'min-h-screen w-full max-w-none rounded-none' : 'w-[92vw] max-w-3xl rounded-xl',
                  )}
                >
                  <Dialog.Title className="sr-only">{title.title}</Dialog.Title>

                  {/* Hero */}
                  <div
                    className="relative isolate aspect-video w-full"
                    onMouseEnter={handleTrailerPointerActivity}
                    onMouseMove={handleTrailerPointerActivity}
                    onMouseLeave={handleTrailerPointerLeave}
                  >
                    <TrailerAmbientGlow
                      sample={ambientSample}
                      visible={hasTrailer && trailerLoaded}
                      className="-inset-16 z-0"
                    />
                    <Image
                      src={title.backdrop || '/placeholder.svg'}
                      alt={title.title}
                      fill
                      sizes="100vw"
                      className={cn('object-cover transition-opacity duration-300', hasTrailer && trailerLoaded && 'opacity-0')}
                      priority
                    />
                    {hasTrailer && trailer?.videoKey && (
                      <YouTubeTrailer
                        key={trailerKey}
                        ref={trailerPlayerRef}
                        videoKey={trailer.videoKey}
                        playing={trailerPlaying}
                        muted={muted}
                        visible={trailerLoaded}
                        onEnded={onTrailerEnded}
                        onPlaybackChange={setTrailerPlaying}
                        onMuteChange={setMuted}
                        onReadyChange={setTrailerLoaded}
                        onTimeUpdate={onTimeUpdate}
                        onError={() => setFailedTrailer(trailerKey)}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-black/10" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />

                    <Dialog.Close
                      aria-label="Close"
                      className="absolute right-4 top-4 z-10 grid size-9 place-items-center rounded-full bg-card/80 text-foreground transition-colors hover:bg-card"
                    >
                      <X className="size-5" />
                    </Dialog.Close>

                    <motion.button
                      type="button"
                      onClick={() => setExpanded((current) => !current)}
                      aria-label={expanded ? 'Return to detail modal' : 'Expand title details'}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.94 }}
                      className="absolute left-4 top-4 z-10 grid size-9 place-items-center rounded-full bg-card/80 text-foreground transition-colors hover:bg-card"
                    >
                      {expanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
                    </motion.button>

                    {hasTrailer && (
                      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setTrailerLoaded(true)
                            trailerPlayerRef.current?.togglePlayback()
                          }}
                          aria-label={trailerPlaying ? 'Pause trailer' : 'Play trailer'}
                          className="grid size-9 place-items-center rounded-full border border-white/40 bg-black/40 text-foreground backdrop-blur transition-all hover:border-white/70"
                        >
                          {trailerPlaying ? <Pause className="size-4 fill-current" /> : <Play className="size-4 fill-current" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => trailerPlayerRef.current?.toggleMute()}
                          aria-label={muted ? 'Unmute trailer' : 'Mute trailer'}
                          className="grid size-9 place-items-center rounded-full border border-white/40 bg-black/40 text-foreground backdrop-blur transition-colors hover:border-white/70"
                        >
                          {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                        </button>
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-5 sm:p-8">
                      {title.logo ? (
                        <div
                          className={cn(
                            'relative',
                            expanded
                              ? 'h-24 w-[min(85%,42rem)] sm:h-36 sm:w-[min(65%,52rem)]'
                              : 'h-12 w-[min(75%,20rem)] sm:h-16 sm:w-[min(70%,24rem)]',
                          )}
                        >
                          <Image
                            src={title.logo}
                            alt={title.title}
                            fill
                            sizes={expanded ? '(max-width: 640px) 85vw, 52rem' : '(max-width: 640px) 75vw, 24rem'}
                            className="object-contain object-left"
                          />
                        </div>
                      ) : (
                        <h2 className="font-display max-w-[80%] text-balance text-3xl font-extrabold leading-none tracking-tight sm:text-4xl">
                          {title.title}
                        </h2>
                      )}
                      <motion.div
                        initial={false}
                        animate={trailerPlaying && (!trailerHovered || (expanded && !trailerControlsVisible)) ? { height: 0, opacity: 0 } : { height: 'auto', opacity: 1 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        aria-hidden={trailerPlaying && (!trailerHovered || (expanded && !trailerControlsVisible))}
                        className="flex flex-wrap items-center gap-3 overflow-hidden"
                        style={{ pointerEvents: trailerPlaying && (!trailerHovered || (expanded && !trailerControlsVisible)) ? 'none' : 'auto' }}
                      >
                        {isUpcoming ? (
                          <span className="inline-flex items-center rounded-full bg-white/15 px-6 py-2.5 text-sm font-semibold text-foreground backdrop-blur sm:px-7 sm:py-3 sm:text-base">
                            Coming Soon
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              onOpenChange(false)
                              router.push(watchHref(title))
                            }}
                            className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-2.5 text-sm font-semibold text-background transition-transform hover:scale-[1.03] active:scale-95 sm:px-7 sm:py-3 sm:text-base"
                          >
                            <Play className="size-4 fill-background sm:size-5" />
                            {title.watchProgress ? 'Continue Watching' : 'Play'}
                          </button>
                        )}
                        <button
                          onClick={() => toggle(title.id)}
                          aria-label={has(title.id) ? 'Remove from My List' : 'Add to My List'}
                          className="grid size-10 place-items-center rounded-full border border-white/40 bg-black/30 text-foreground backdrop-blur transition-colors hover:border-white sm:size-11"
                        >
                          {has(title.id) ? <Check className="size-4 text-primary sm:size-5" /> : <Plus className="size-4 sm:size-5" />}
                        </button>
                        {!isUpcoming && (
                          <div>
                            <RatingButton id={title.id} large />
                          </div>
                        )}
                        {title.watchProgress && (
                          <div className="basis-full max-w-sm space-y-1 text-xs text-muted-foreground">
                            <div className="flex items-center justify-between gap-3">
                              <span>
                                {title.type === 'tv' && title.watchProgress.seasonNumber && title.watchProgress.episodeNumber
                                  ? `S${title.watchProgress.seasonNumber}:E${title.watchProgress.episodeNumber}`
                                  : 'Continue Watching'}
                              </span>
                              <span>{title.watchProgress.progressPercent}% watched</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-white/20">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${Math.min(100, Math.max(0, title.watchProgress.progressPercent))}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </motion.div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="grid gap-6 p-5 sm:p-8 md:grid-cols-[2fr_1fr]">
                    <div className="min-w-0 space-y-4">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                        <MatchScore id={title.id} />
                        <span className="text-muted-foreground">{title.year}</span>
                        <span className="rounded border border-white/25 px-1.5 py-0.5 text-xs font-semibold">{title.maturity}</span>
                        <span className="text-muted-foreground">
                          {title.type === 'tv'
                            ? title.seasons?.length
                              ? `${title.seasons.length} Season${title.seasons.length === 1 ? '' : 's'}`
                              : 'Series'
                            : title.runtime}
                        </span>
                        <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-bold">{title.quality}</span>
                        <span className="inline-flex items-center gap-1 text-muted-foreground" title="Sceneflix views">
                          <Eye className="size-3.5" />
                          {viewCount === null ? '—' : `${viewCount.toLocaleString()} views`}
                        </span>
                      </div>
                      <p className="text-pretty text-sm italic leading-relaxed text-muted-foreground">{title.tagline}</p>
                      <p className="text-pretty text-sm leading-relaxed text-foreground/90">{title.description}</p>
                    </div>

                    <div className="space-y-3 text-sm">
                      <p>
                        <span className="text-muted-foreground">Cast: </span>
                        <span className="text-foreground/90">
                          {detailsLoading ? 'Loading details…' : title.cast.map((c) => c.name).join(', ')}
                        </span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Genres: </span>
                        <span className="text-foreground/90">
                          {detailsLoading ? 'Loading details…' : title.genres.join(', ')}
                        </span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">This {title.type === 'tv' ? 'show' : 'movie'} is: </span>
                        <span className="text-foreground/90">
                          {detailsLoading ? 'Loading details…' : title.keywords.join(', ')}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Cast avatars */}
                  <div className="border-t border-white/5 px-5 py-6 sm:px-8">
                    <h3 className="mb-4 font-heading text-sm font-bold uppercase tracking-wide text-muted-foreground">Cast</h3>
                    {detailsLoading ? (
                      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                        <LoaderCircle className="size-4 animate-spin text-primary" />
                        Loading cast details…
                      </div>
                    ) : title.cast.length > 0 ? (
                      <div className="flex max-w-full snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain pb-3 pr-2 touch-pan-x">
                        {title.cast.map((member, index) => (
                          <Link
                            key={`${member.name}-${member.character}-${index}`}
                            href={member.id ? `/people/${member.id}` : '#'}
                            prefetch={false}
                            onMouseEnter={() => { if (member.id) router.prefetch(`/people/${member.id}`) }}
                            onFocus={() => { if (member.id) router.prefetch(`/people/${member.id}`) }}
                            onClick={(event) => {
                              if (!member.id) event.preventDefault()
                              else close()
                            }}
                            aria-label={`Open ${member.name}'s page`}
                            className="flex w-24 shrink-0 snap-start flex-col items-center gap-2 text-center transition-opacity hover:opacity-80"
                          >
                            <div className="relative size-16 overflow-hidden rounded-full ring-1 ring-white/10">
                              <Image src={member.photo || '/placeholder.svg'} alt={member.name} fill sizes="64px" className="object-cover" />
                            </div>
                            <div className="leading-tight">
                              <p className="break-words text-xs font-semibold">{member.name}</p>
                              <p className="break-words text-[11px] text-muted-foreground">{member.character}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No cast information available.</p>
                    )}
                  </div>

                  {/* Production companies */}
                  {title.productionCompanies && title.productionCompanies.length > 0 && (
                    <div className="border-t border-white/5 px-5 py-6 sm:px-8">
                      <h3 className="mb-4 font-heading text-sm font-bold uppercase tracking-wide text-muted-foreground">
                        Production Companies
                      </h3>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {title.productionCompanies.map((company) => (
                          <Link
                            key={company.id}
                            href={`/production-company/${company.id}`}
                            prefetch={false}
                            onMouseEnter={() => router.prefetch(`/production-company/${company.id}`)}
                            onFocus={() => router.prefetch(`/production-company/${company.id}`)}
                            onClick={() => close()}
                            className="flex min-h-20 items-center gap-4 rounded-lg border border-white/10 bg-white/[0.03] p-3 transition-colors hover:border-primary/50 hover:bg-white/[0.06]"
                          >
                            <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white p-2">
                              {company.logo ? (
                                <Image src={company.logo} alt="" fill sizes="56px" className="object-contain p-2" />
                              ) : (
                                <span className="text-center text-[9px] font-bold uppercase text-black/60">Company</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">{company.name}</p>
                              {company.originCountry && (
                                <p className="mt-1 text-xs text-muted-foreground">{company.originCountry}</p>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Episodes */}
                  {title.seasons && season && (
                    <div className="border-t border-white/5 px-5 py-6 sm:px-8">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <h3 className="font-heading text-lg font-bold">Episodes</h3>
                        <Select.Root
                          value={String(seasonIdx)}
                          onValueChange={(v) => setSeasonIdx(Number(v))}
                        >
                          <Select.Trigger className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-secondary px-3 py-2 text-sm font-medium outline-none">
                            <Select.Value />
                            <Select.Icon>
                              <ChevronDown className="size-4" />
                            </Select.Icon>
                          </Select.Trigger>
                          <Select.Portal>
                            <Select.Content className="z-[100] overflow-hidden rounded-md border border-white/10 bg-popover shadow-2xl">
                              <Select.Viewport className="p-1">
                                {title.seasons.map((s, i) => (
                                  <Select.Item
                                    key={s.number}
                                    value={String(i)}
                                    className="cursor-pointer rounded px-3 py-2 text-sm outline-none data-[highlighted]:bg-white/10 data-[state=checked]:text-primary"
                                  >
                                    <Select.ItemText>
                                      {s.name}{isSeasonReleased(s) ? ` (${s.episodeCount ?? s.episodes.length} Episodes)` : ' · Coming Soon'}
                                    </Select.ItemText>
                                  </Select.Item>
                                ))}
                              </Select.Viewport>
                            </Select.Content>
                          </Select.Portal>
                        </Select.Root>
                      </div>

                      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-semibold">{season.name}:</span>
                        <span className="rounded border border-white/20 px-1.5 py-0.5 font-semibold">{season.maturity}</span>
                        <span className="text-muted-foreground">{season.contentTags.join(', ')}</span>
                      </div>

                      <div className="mb-4 flex items-center justify-between gap-3 rounded-lg bg-secondary/60 px-4 py-3">
                        <span className="flex items-center gap-2 text-sm font-medium">
                          <Lock className="size-4 text-primary" />
                          Spoiler Protection
                        </span>
                        <Switch.Root
                          checked={spoilerProtected}
                          onCheckedChange={setSpoilerProtected}
                          className="relative h-6 w-11 rounded-full bg-white/15 outline-none data-[state=checked]:bg-primary"
                        >
                          <Switch.Thumb className="block size-4.5 translate-x-0.5 rounded-full bg-white transition-transform duration-200 data-[state=checked]:translate-x-[22px]" />
                        </Switch.Root>
                      </div>

                      <ul>
                        <AnimatePresence mode="wait">
                          {seasonLoading && <li className="py-6 text-sm text-muted-foreground">Loading episodes…</li>}
                        {season.episodes.map((ep) => (
                            <EpisodeRow
                              key={ep.id}
                              episode={ep}
                              spoilerProtected={spoilerProtected}
                              available={isEpisodeReleased(title, season, ep)}
                              onPlay={() => {
                                if (!isEpisodeReleased(title, season, ep)) return
                                onOpenChange(false)
                                router.push(`/watch/${title.slug}?s=${season.number}&e=${ep.number}`)
                              }}
                            />
                          ))}
                        </AnimatePresence>
                      </ul>
                      {!seasonLoading && season.episodes.length === 0 && (
                        <p className="py-4 text-sm text-muted-foreground">Episodes are coming soon.</p>
                      )}
                    </div>
                  )}

                  {/* Trailers & more */}
                  <div className="border-t border-white/5 px-5 py-6 sm:px-8">
                    <h3 className="mb-4 font-heading text-lg font-bold">Trailers &amp; More</h3>
                    {detailsLoading ? (
                      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                        <LoaderCircle className="size-4 animate-spin text-primary" />
                        Loading trailers…
                      </div>
                    ) : trailers.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {trailers.map((t) => (
                        <a
                          key={t.id}
                          href={t.videoKey ? `https://www.youtube.com/watch?v=${encodeURIComponent(t.videoKey)}` : undefined}
                          target={t.videoKey ? '_blank' : undefined}
                          rel={t.videoKey ? 'noopener noreferrer' : undefined}
                          aria-label={`Open ${t.title} on YouTube`}
                          className="group relative aspect-video overflow-hidden rounded-md ring-1 ring-white/10"
                        >
                          <Image src={t.thumbnail || '/placeholder.svg'} alt={t.title} fill sizes="240px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/10" />
                          <span
                            className={cn(
                              'absolute right-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase',
                              t.kind === 'Trailer' ? 'bg-primary text-primary-foreground' : 'bg-white/85 text-black',
                            )}
                          >
                            {t.kind}
                          </span>
                          <span className="absolute inset-0 grid place-items-center">
                            <span className="grid size-10 place-items-center rounded-full bg-black/50 ring-1 ring-white/40 transition-transform group-hover:scale-110">
                              <Play className="size-4 fill-foreground text-foreground" />
                            </span>
                          </span>
                          <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent p-2 text-left text-xs font-medium">
                            {t.title}
                          </span>
                        </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No trailers available.</p>
                    )}

                    {/* <h3 className="mb-4 mt-8 font-heading text-lg font-bold">About {title.title}</h3>
                    <div className="grid gap-3 text-sm sm:grid-cols-2">
                      <p>
                        <span className="text-muted-foreground">Creator: </span>
                        {title.creator}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Genres: </span>
                        {title.genres.join(', ')}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Cast: </span>
                        {title.cast.map((c) => c.name).join(', ')}
                      </p>
                      <p>
                        <span className="text-muted-foreground">This {title.type === 'tv' ? 'show' : 'movie'} is: </span>
                        {title.keywords.join(', ')}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Maturity Rating: </span>
                        {title.maturity}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Status: </span>
                        {title.status}
                      </p>
                    </div> */}
                  </div>

                  {/* Similar */}
                  {similar.length > 0 && (
                    <div className="border-t border-white/5 px-5 py-6 sm:px-8">
                      <h3 className="mb-4 font-heading text-lg font-bold">More Like This</h3>
                      <MediaGlowBoundary className="relative isolate overflow-visible">
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {similar.map((s) => (
                            <LandscapeCard
                              key={s.id}
                              title={s}
                              onSelect={() => open(s.id)}
                              className="w-full shrink sm:w-full md:w-full"
                            />
                          ))}
                        </div>
                      </MediaGlowBoundary>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
