'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Select from '@radix-ui/react-select'
import * as Switch from '@radix-ui/react-switch'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Check,
  ChevronDown,
  Lock,
  Play,
  Plus,
  ThumbsUp,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { useCatalog, useModal, useMyList } from '@/components/providers'
import { LandscapeCard } from '@/components/media-card'
import { cn } from '@/lib/utils'
import type { Title } from '@/lib/types'

function EpisodeRow({
  episode,
  spoilerProtected,
}: {
  episode: NonNullable<Title['seasons']>[number]['episodes'][number]
  spoilerProtected: boolean
}) {
  const [revealed, setRevealed] = useState(false)
  const hidden = spoilerProtected && !revealed

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
        {!hidden && (
          <button
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
          <span className="shrink-0 text-xs text-muted-foreground">{episode.duration}</span>
        </div>
        <p className={cn('mt-1 line-clamp-2 text-xs text-muted-foreground', hidden && 'select-none blur-sm')}>
          {hidden ? 'Spoiler protection is on. Reveal the thumbnail to see details for this episode.' : episode.description}
        </p>
      </div>
    </motion.li>
  )
}

export function DetailModal() {
  const { openId, close } = useModal()
  const { getTitle, registerTitles } = useCatalog()
  const router = useRouter()
  const { has, toggle } = useMyList()
  const [muted, setMuted] = useState(true)
  const [spoilerProtected, setSpoilerProtected] = useState(true)
  const [seasonIdx, setSeasonIdx] = useState(0)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [requestedDetails, setRequestedDetails] = useState<string[]>([])

  const title = openId ? getTitle(openId) : undefined

  useEffect(() => {
    if (!openId || loadingId === openId) return
    if (requestedDetails.includes(openId)) return
    if (title && title.cast.length > 0 && title.trailers.length > 0) return

    const controller = new AbortController()
    setLoadingId(openId)

    fetch(`/api/titles/${openId}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : undefined))
      .then((detail: Title | undefined) => {
        if (detail) registerTitles([detail])
      })
      .catch(() => {})
      .finally(() => {
        setRequestedDetails((ids) => (ids.includes(openId) ? ids : [...ids, openId]))
        setLoadingId(null)
      })

    return () => controller.abort()
  }, [loadingId, openId, registerTitles, requestedDetails, title])

  const similar = useMemo(() => {
    if (!title) return []
    return title.similar.map(getTitle).filter((t): t is Title => Boolean(t)).slice(0, 6)
  }, [title])

  const season = title?.seasons?.[seasonIdx] ?? title?.seasons?.[0]

  function onOpenChange(open: boolean) {
    if (!open) {
      close()
      setSeasonIdx(0)
      setMuted(true)
    }
  }

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
                className="fixed inset-0 z-[90] overflow-y-auto py-6 md:py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: 24 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 12 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                  className="relative mx-auto w-[92vw] max-w-3xl overflow-hidden rounded-xl bg-card shadow-2xl shadow-black/80 ring-1 ring-white/10"
                >
                  <Dialog.Title className="sr-only">{title.title}</Dialog.Title>

                  {/* Hero */}
                  <div className="relative aspect-video w-full">
                    <Image
                      src={title.backdrop || '/placeholder.svg'}
                      alt={title.title}
                      fill
                      sizes="100vw"
                      className="object-cover"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-black/10" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />

                    <Dialog.Close
                      aria-label="Close"
                      className="absolute right-4 top-4 z-10 grid size-9 place-items-center rounded-full bg-card/80 text-foreground transition-colors hover:bg-card"
                    >
                      <X className="size-5" />
                    </Dialog.Close>

                    <button
                      onClick={() => setMuted((m) => !m)}
                      aria-label={muted ? 'Unmute' : 'Mute'}
                      className="absolute bottom-4 right-4 z-10 grid size-9 place-items-center rounded-full border border-white/40 bg-black/40 text-foreground backdrop-blur"
                    >
                      {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                    </button>

                    <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-5 sm:p-8">
                      <h2 className="font-display max-w-[80%] text-balance text-3xl font-extrabold leading-none tracking-tight sm:text-4xl">
                        {title.title}
                      </h2>
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => router.push(`/watch/${title.slug}`)}
                          className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-2.5 text-sm font-semibold text-background transition-transform hover:scale-[1.03] active:scale-95 sm:px-7 sm:py-3 sm:text-base"
                        >
                          <Play className="size-4 fill-background sm:size-5" />
                          Play
                        </button>
                        <button
                          onClick={() => toggle(title.id)}
                          aria-label={has(title.id) ? 'Remove from My List' : 'Add to My List'}
                          className="grid size-10 place-items-center rounded-full border border-white/40 bg-black/30 text-foreground backdrop-blur transition-colors hover:border-white sm:size-11"
                        >
                          {has(title.id) ? <Check className="size-4 text-primary sm:size-5" /> : <Plus className="size-4 sm:size-5" />}
                        </button>
                        <button
                          aria-label="Rate this title"
                          className="grid size-10 place-items-center rounded-full border border-white/40 bg-black/30 text-foreground backdrop-blur transition-colors hover:border-white sm:size-11"
                        >
                          <ThumbsUp className="size-4 sm:size-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="grid gap-6 p-5 sm:p-8 md:grid-cols-[2fr_1fr]">
                    <div className="min-w-0 space-y-4">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                        <span className="font-semibold text-emerald-400">{Math.round(title.rating * 10)}% Match</span>
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
                      </div>
                      <p className="text-pretty text-sm italic leading-relaxed text-muted-foreground">{title.tagline}</p>
                      <p className="text-pretty text-sm leading-relaxed text-foreground/90">{title.description}</p>
                    </div>

                    <div className="space-y-3 text-sm">
                      <p>
                        <span className="text-muted-foreground">Cast: </span>
                        <span className="text-foreground/90">{title.cast.map((c) => c.name).join(', ')}</span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Genres: </span>
                        <span className="text-foreground/90">{title.genres.join(', ')}</span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">This {title.type === 'tv' ? 'show' : 'movie'} is: </span>
                        <span className="text-foreground/90">{title.keywords.join(', ')}</span>
                      </p>
                    </div>
                  </div>

                  {/* Cast avatars */}
                  <div className="border-t border-white/5 px-5 py-6 sm:px-8">
                    <h3 className="mb-4 font-heading text-sm font-bold uppercase tracking-wide text-muted-foreground">Cast</h3>
                    <div className="no-scrollbar flex gap-5 overflow-x-auto pb-1">
                      {title.cast.map((member) => (
                        <div key={member.character} className="flex w-20 shrink-0 flex-col items-center gap-2 text-center">
                          <div className="relative size-16 overflow-hidden rounded-full ring-1 ring-white/10">
                            <Image src={member.photo || '/placeholder.svg'} alt={member.name} fill sizes="64px" className="object-cover" />
                          </div>
                          <div className="leading-tight">
                            <p className="line-clamp-1 text-xs font-semibold">{member.name}</p>
                            <p className="line-clamp-1 text-[11px] text-muted-foreground">{member.character}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

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
                                      {s.name} ({s.episodes.length} Episodes)
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
                          {season.episodes.map((ep) => (
                            <EpisodeRow key={ep.id} episode={ep} spoilerProtected={spoilerProtected} />
                          ))}
                        </AnimatePresence>
                      </ul>
                    </div>
                  )}

                  {/* Trailers & more */}
                  <div className="border-t border-white/5 px-5 py-6 sm:px-8">
                    <h3 className="mb-4 font-heading text-lg font-bold">Trailers &amp; More</h3>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {title.trailers.map((t) => (
                        <button
                          key={t.id}
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
                        </button>
                      ))}
                    </div>

                    <h3 className="mb-4 mt-8 font-heading text-lg font-bold">About {title.title}</h3>
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
                    </div>
                  </div>

                  {/* Similar */}
                  {similar.length > 0 && (
                    <div className="border-t border-white/5 px-5 py-6 sm:px-8">
                      <h3 className="mb-4 font-heading text-lg font-bold">More Like This</h3>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {similar.map((s) => (
                          <LandscapeCard key={s.id} title={s} className="w-full shrink sm:w-full md:w-full" />
                        ))}
                      </div>
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
