'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Check,
  LoaderCircle,
  Lock,
  Pause,
  Play,
  Plus,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { MatchScore } from '@/components/match-score'
import { RatingButton } from '@/components/rating-button'
import { useCatalog, useMyList } from '@/components/providers'
import { YouTubeTrailer, type YouTubeTrailerHandle } from '@/components/youtube-trailer'
import { isEpisodeReleased, isSeasonReleased, isTitleReleased } from '@/lib/availability'
import { cn } from '@/lib/utils'
import type { Title } from '@/lib/types'

function watchHref(title: Title): string {
  const progress = title.watchProgress
  if (!progress) return `/watch/${title.slug}`
  if (title.type === 'tv' && progress.seasonNumber && progress.episodeNumber) {
    return `/watch/${title.slug}?s=${progress.seasonNumber}&e=${progress.episodeNumber}`
  }
  return `/watch/${title.slug}`
}

export function TitlePageView({ initialTitle }: { initialTitle: Title }) {
  const router = useRouter()
  const { getTitle, registerTitles } = useCatalog()
  const { has, toggle } = useMyList()
  const [detailTitle, setDetailTitle] = useState<Title | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(!initialTitle.detailsLoaded)
  const [muted, setMuted] = useState(true)
  const [trailerLoaded, setTrailerLoaded] = useState(false)
  const [trailerPlaying, setTrailerPlaying] = useState(false)
  const [trailerHovered, setTrailerHovered] = useState(false)
  const [failedTrailer, setFailedTrailer] = useState<string | null>(null)
  const [seasonIdx, setSeasonIdx] = useState(0)
  const trailerPlayerRef = useRef<YouTubeTrailerHandle>(null)

  const title = detailTitle ?? initialTitle

  useEffect(() => {
    registerTitles([title])
  }, [registerTitles, title])

  useEffect(() => {
    if (initialTitle.detailsLoaded) return
    const controller = new AbortController()
    setDetailsLoading(true)

    fetch(`/api/titles/${initialTitle.id}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : undefined))
      .then((detail: Title | undefined) => {
        if (!detail) return
        const detailWithProgress = initialTitle.watchProgress
          ? { ...detail, watchProgress: initialTitle.watchProgress }
          : detail
        setDetailTitle(detailWithProgress)
        registerTitles([detailWithProgress])
      })
      .catch(() => {})
      .finally(() => setDetailsLoading(false))

    return () => controller.abort()
  }, [initialTitle.detailsLoaded, initialTitle.id, registerTitles])

  const trailers = useMemo(
    () => [...title.trailers].sort((a, b) => Number(b.kind === 'Trailer') - Number(a.kind === 'Trailer')),
    [title.trailers],
  )
  const trailer = trailers.find((item) => item.videoKey)
  const trailerKey = `${title.id}:${trailer?.videoKey ?? ''}`
  const hasTrailer = Boolean(trailer?.videoKey?.trim()) && failedTrailer !== trailerKey
  const season = title.seasons?.[seasonIdx] ?? title.seasons?.[0]
  const isUpcoming = !isTitleReleased(title)
  const similar = useMemo(
    () => title.similar.map(getTitle).filter((item): item is Title => Boolean(item)).slice(0, 6),
    [getTitle, title.similar],
  )

  useEffect(() => {
    setTrailerLoaded(false)
    setTrailerPlaying(hasTrailer)
    setTrailerHovered(false)
    setSeasonIdx(0)
  }, [hasTrailer, trailer?.videoKey, title.id])

  function onTrailerEnded() {
    setTrailerPlaying(false)
    setTrailerLoaded(false)
    setTrailerHovered(false)
  }

  function goBack() {
    if (window.history.length > 1) router.back()
    else router.push('/')
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="min-h-screen bg-background pb-16"
    >
      <section
        className="relative overflow-hidden border-b border-white/10"
        onMouseEnter={() => setTrailerHovered(true)}
        onMouseLeave={() => setTrailerHovered(false)}
      >
        <div className="relative mx-auto aspect-video min-h-[30rem] max-w-[1500px] overflow-hidden lg:aspect-[2.15/1]">
          <Image
            src={title.backdrop || '/placeholder.svg'}
            alt={title.title}
            fill
            priority
            sizes="100vw"
            className={cn('object-cover transition-opacity duration-300', hasTrailer && trailerLoaded && 'opacity-0')}
          />
          {hasTrailer && trailer?.videoKey && (
            <YouTubeTrailer
              ref={trailerPlayerRef}
              key={trailerKey}
              videoKey={trailer.videoKey}
              playing={trailerPlaying}
              muted={muted}
              visible={trailerLoaded}
              onEnded={onTrailerEnded}
              onPlaybackChange={setTrailerPlaying}
              onMuteChange={setMuted}
              onReadyChange={setTrailerLoaded}
              onError={() => setFailedTrailer(trailerKey)}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/45 to-black/15" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-transparent to-transparent" />

          <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4 sm:p-8">
            <motion.button
              type="button"
              onClick={goBack}
              whileHover={{ x: -3 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 rounded-full bg-black/55 px-4 py-2 text-sm font-semibold backdrop-blur transition-colors hover:bg-black/75"
            >
              <ArrowLeft className="size-4" />
              Back to details
            </motion.button>
            {hasTrailer && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTrailerLoaded(true)
                    trailerPlayerRef.current?.togglePlayback()
                  }}
                  aria-label={trailerPlaying ? 'Pause trailer' : 'Play trailer'}
                  className="grid size-9 place-items-center rounded-full border border-white/35 bg-black/55 backdrop-blur transition-colors hover:border-white/75"
                >
                  {trailerPlaying ? <Pause className="size-4 fill-current" /> : <Play className="size-4 fill-current" />}
                </button>
                <button
                  type="button"
                  onClick={() => trailerPlayerRef.current?.toggleMute()}
                  aria-label={muted ? 'Unmute trailer' : 'Mute trailer'}
                  className="grid size-9 place-items-center rounded-full border border-white/35 bg-black/55 backdrop-blur transition-colors hover:border-white/75"
                >
                  {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                </button>
              </div>
            )}
          </div>

          <div className="absolute inset-x-0 bottom-0 z-10 mx-auto max-w-[1500px] p-5 sm:p-10 lg:p-14">
            {title.logo ? (
              <div className="relative h-16 w-[min(70%,30rem)] sm:h-24 sm:w-[min(60%,38rem)]">
                <Image src={title.logo} alt={title.title} fill sizes="608px" className="object-contain object-left" />
              </div>
            ) : (
              <h1 className="max-w-3xl font-display text-4xl font-extrabold tracking-tight sm:text-6xl">{title.title}</h1>
            )}
            <motion.div
              initial={false}
              animate={trailerPlaying && !trailerHovered ? { height: 0, opacity: 0 } : { height: 'auto', opacity: 1 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              aria-hidden={trailerPlaying && !trailerHovered}
              className="mt-5 flex flex-wrap items-center gap-3 overflow-hidden"
              style={{ pointerEvents: trailerPlaying && !trailerHovered ? 'none' : 'auto' }}
            >
              {isUpcoming ? (
                <span className="rounded-full bg-white/15 px-6 py-3 font-semibold backdrop-blur">Coming Soon</span>
              ) : (
                <button
                  type="button"
                  onClick={() => router.push(watchHref(title))}
                  className="inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3 font-semibold text-background transition-transform hover:scale-[1.03] active:scale-95"
                >
                  <Play className="size-5 fill-background" />
                  {title.watchProgress ? 'Continue Watching' : 'Play'}
                </button>
              )}
              <button
                type="button"
                onClick={() => toggle(title.id)}
                aria-label={has(title.id) ? 'Remove from My List' : 'Add to My List'}
                className="grid size-12 place-items-center rounded-full border border-white/35 bg-black/45 backdrop-blur transition-colors hover:border-white"
              >
                {has(title.id) ? <Check className="size-5 text-primary" /> : <Plus className="size-5" />}
              </button>
              {!isUpcoming && <RatingButton id={title.id} large />}
            </motion.div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1500px] gap-10 px-5 py-8 sm:px-10 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)] lg:py-12">
        <div className="space-y-10">
          <section>
            <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
              <MatchScore id={title.id} />
              <span className="text-muted-foreground">{title.year}</span>
              <span className="rounded border border-white/25 px-1.5 py-0.5 text-xs font-semibold">{title.maturity}</span>
              <span className="text-muted-foreground">{title.type === 'tv' ? `${title.seasons?.length ?? 0} Seasons` : title.runtime}</span>
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-bold">{title.quality}</span>
            </div>
            <p className="text-sm italic leading-relaxed text-muted-foreground">{title.tagline}</p>
            <p className="mt-4 max-w-4xl text-pretty leading-relaxed text-foreground/90">{title.description}</p>
          </section>

          <section className="border-t border-white/10 pt-8">
            <h2 className="mb-5 font-heading text-xl font-bold">Cast</h2>
            {detailsLoading ? (
              <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin text-primary" /> Loading cast details…
              </div>
            ) : title.cast.length > 0 ? (
              <div className="flex gap-5 overflow-x-auto pb-3">
                {title.cast.map((member, index) => (
                  <div key={`${member.name}-${member.character}-${index}`} className="w-24 shrink-0 text-center">
                    <div className="relative mx-auto size-16 overflow-hidden rounded-full ring-1 ring-white/10">
                      <Image src={member.photo || '/placeholder.svg'} alt={member.name} fill sizes="64px" className="object-cover" />
                    </div>
                    <p className="mt-2 break-words text-xs font-semibold">{member.name}</p>
                    <p className="break-words text-[11px] text-muted-foreground">{member.character}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No cast information available.</p>
            )}
          </section>

          {title.seasons && season && (
            <section className="border-t border-white/10 pt-8">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-heading text-xl font-bold">Episodes</h2>
                <label className="inline-flex items-center gap-2 text-sm">
                  <span className="sr-only">Season</span>
                  <select
                    value={seasonIdx}
                    onChange={(event) => setSeasonIdx(Number(event.target.value))}
                    className="rounded-md border border-white/15 bg-secondary px-3 py-2 outline-none"
                  >
                    {title.seasons.map((item, index) => (
                      <option key={item.number} value={index}>
                        {item.name}{isSeasonReleased(item) ? '' : ' · Coming Soon'}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="divide-y divide-white/5 rounded-lg border border-white/10 bg-card/40 px-4">
                {season.episodes.map((episode) => {
                  const available = isEpisodeReleased(title, season, episode)
                  return (
                    <div key={episode.id} className="flex gap-4 py-4">
                      <span className="w-5 shrink-0 pt-1 text-center font-semibold text-muted-foreground">{episode.number}</span>
                      <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-md sm:w-44">
                        <Image src={episode.still || '/placeholder.svg'} alt={episode.title} fill sizes="176px" className={cn('object-cover', !available && 'grayscale')} />
                        {!available && <div className="absolute inset-0 grid place-items-center bg-black/50"><Lock className="size-4 text-primary" /></div>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-semibold">{episode.title}</p>
                          <span className="shrink-0 text-xs text-muted-foreground">{available ? episode.duration : 'Coming Soon'}</span>
                        </div>
                        <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{episode.description}</p>
                        {available && <button type="button" onClick={() => router.push(`/watch/${title.slug}?s=${season.number}&e=${episode.number}`)} className="mt-2 text-xs font-semibold text-primary hover:underline">Play episode</button>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4 text-sm lg:pt-1">
          <section className="space-y-3 rounded-xl border border-white/10 bg-card/45 p-5">
            <h2 className="font-heading text-base font-bold">About {title.title}</h2>
            <p><span className="text-muted-foreground">Creator: </span>{title.creator}</p>
            <p><span className="text-muted-foreground">Genres: </span>{title.genres.join(', ')}</p>
            <p><span className="text-muted-foreground">This {title.type === 'tv' ? 'show' : 'movie'} is: </span>{title.keywords.join(', ')}</p>
            <p><span className="text-muted-foreground">Status: </span>{title.status}</p>
          </section>

          <section className="rounded-xl border border-white/10 bg-card/45 p-5">
            <h2 className="mb-4 font-heading text-base font-bold">Trailers &amp; More</h2>
            {detailsLoading ? <p className="text-muted-foreground">Loading trailers…</p> : trailers.length > 0 ? (
              <div className="space-y-3">
                {trailers.map((item) => (
                  <a key={item.id} href={item.videoKey ? `https://www.youtube.com/watch?v=${encodeURIComponent(item.videoKey)}` : undefined} target={item.videoKey ? '_blank' : undefined} rel="noreferrer" className="group relative block aspect-video overflow-hidden rounded-md ring-1 ring-white/10">
                    <Image src={item.thumbnail || '/placeholder.svg'} alt={item.title} fill sizes="360px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    <span className="absolute inset-0 grid place-items-center bg-black/20"><span className="grid size-10 place-items-center rounded-full bg-black/55"><Play className="size-4 fill-foreground" /></span></span>
                    <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/85 to-transparent p-2 text-xs font-medium">{item.title}</span>
                  </a>
                ))}
              </div>
            ) : <p className="text-muted-foreground">No trailers available.</p>}
          </section>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mx-auto max-w-[1500px] border-t border-white/10 px-5 py-8 sm:px-10">
          <h2 className="mb-5 font-heading text-xl font-bold">More Like This</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {similar.map((item) => (
              <button key={item.id} type="button" onClick={() => router.push(`/title/${item.slug}`)} className="group relative aspect-video overflow-hidden rounded-md text-left ring-1 ring-white/10">
                <Image src={item.backdrop || item.poster || '/placeholder.svg'} alt={item.title} fill sizes="240px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/90 to-transparent p-2 text-xs font-semibold">{item.title}</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </motion.main>
  )
}
