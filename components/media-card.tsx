'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { useModal } from '@/components/providers'
import { CardActions } from '@/components/card-actions'
import { MatchScore } from '@/components/match-score'
import { MaturityTag, QualityTag } from '@/components/pieces'
import { cn } from '@/lib/utils'
import { isTitleReleased } from '@/lib/availability'
import type { Title } from '@/lib/types'

function titleBadges(title: Title) {
  return title.badges?.length ? title.badges : title.badge ? [title.badge] : []
}

function TopBadges({ title }: { title: Title }) {
  const badges = titleBadges(title).filter((badge) => badge === 'Top 10')
  if (badges.length === 0) return null

  return (
    <div className="absolute left-0 top-2 z-10 flex max-w-[82%] flex-col items-start gap-1">
      {badges.map((badge) => (
        <span
          key={badge}
          aria-label="Top 10"
          className="rounded-r bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none tracking-wide text-primary-foreground"
        >
          <span className="flex flex-col items-center leading-none">
            <span className="text-[8px]">TOP</span>
            <span>10</span>
          </span>
        </span>
      ))}
    </div>
  )
}

function SideBadges({ title }: { title: Title }) {
  const badges = titleBadges(title).filter((badge) => badge !== 'Top 10')
  if (badges.length === 0) return null

  return (
    <div className="absolute right-0 top-2 z-10 flex max-w-[82%] flex-col items-end gap-1">
      {badges.map((badge) => (
        <span
          key={badge}
          className="rounded-l bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none tracking-wide text-primary-foreground shadow-sm shadow-black/30"
        >
          {badge}
        </span>
      ))}
    </div>
  )
}

function CardTitle({ title, addLogo, addText, className }: { title: Title; addLogo: boolean; addText: boolean; className: string }) {
  if (addLogo && title.logo) {
    return (
      <div className={cn('relative h-7 w-full max-w-[78%]', className)}>
        <Image src={title.logo} alt={title.title} fill sizes="220px" className="object-contain object-left" />
      </div>
    )
  }

  if (!addText) return null

  return <p className={className}>{title.title}</p>
}

function watchHref(title: Title) {
  const progress = title.watchProgress
  if (!progress) return `/watch/${title.slug}`
  const params = title.type === 'tv' && progress.seasonNumber && progress.episodeNumber
    ? `?s=${progress.seasonNumber}&e=${progress.episodeNumber}`
    : ''
  return `/watch/${title.slug}${params}`
}

/**
 * Signature card: shows a PORTRAIT poster at rest, and on hover expands into a
 * wider LANDSCAPE preview with backdrop art, meta and action buttons.
 */
export function PortraitCard({ title, className, addLogo = false, addText = true, artworkOnly = false, preview = true, onSelect }: { title: Title; className?: string; addLogo?: boolean; addText?: boolean; artworkOnly?: boolean; preview?: boolean; onSelect?: () => void }) {
  const { open } = useModal()
  const comingSoon = !isTitleReleased(title)
  const select = () => onSelect ? onSelect() : open(title.id)

  return (
    <motion.div
      className={cn('group relative z-0 w-[150px] shrink-0 sm:w-[170px] md:w-[185px] md:max-lg:w-[165px]', className)}
      whileHover={{ zIndex: 40 }}
    >
      {/* Resting portrait poster */}
      <motion.button
        type="button"
        onClick={select}
        className="relative block aspect-[2/3] w-full overflow-hidden rounded-md ring-1 ring-white/5"
        aria-label={title.title}
      >
        <TopBadges title={title} />
        <SideBadges title={title} />
        <Image
          src={title.poster || '/placeholder.svg'}
          alt={title.title}
          fill
          sizes="185px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {!artworkOnly && <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />}
        <div className="absolute inset-x-0 bottom-0 p-2">
          {!artworkOnly && <CardTitle title={title} addLogo={addLogo} addText={addText} className="line-clamp-1 text-xs font-semibold text-balance" />}
          {comingSoon ? <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-white">Coming Soon</span> : <div className="mt-0.5 flex items-center gap-1 text-[10px] text-white drop-shadow-md">
            <Star className="size-2.5 fill-primary text-primary" />
            {title.rating.toFixed(1)}
          </div>}
        </div>
      </motion.button>

      {/* Expanded landscape preview on hover (desktop) */}
      {preview && <motion.div
        initial={false}
        className="pointer-events-none absolute left-1/2 top-0 hidden w-[300px] -translate-x-1/2 opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 md:block"
        style={{ transformOrigin: 'center top' }}
      >
        <motion.div
          className="overflow-hidden rounded-lg bg-card shadow-2xl shadow-black/70 ring-1 ring-white/10"
          initial={{ scale: 0.85, y: 8 }}
          whileHover={{ scale: 1 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26, delay: 0.15 }}
        >
          <button
            type="button"
            onClick={select}
            className="relative block aspect-video w-full"
            aria-label={`${title.title} preview`}
          >
            <Image
              src={title.backdrop || '/placeholder.svg'}
              alt={title.title}
              fill
              sizes="300px"
              className="object-cover"
            />
            <TopBadges title={title} />
            <SideBadges title={title} />
            {!artworkOnly && <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />}
          </button>
          <div className="space-y-2 p-3">
            <CardActions title={title} />
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
              <MatchScore id={title.id} />
              <MaturityTag maturity={title.maturity} />
              <span className="text-muted-foreground">
                {title.type === 'tv'
                  ? title.seasons?.length
                    ? `${title.seasons.length} Season${title.seasons.length === 1 ? '' : 's'}`
                    : 'Series'
                  : title.runtime}
              </span>
              <QualityTag quality={title.quality} />
            </div>
            <div className="flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
              {title.genres.slice(0, 3).map((g, i) => (
                <span key={g} className="flex items-center gap-1">
                  {i > 0 && <span className="text-primary">•</span>}
                  {g}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>}
    </motion.div>
  )
}

/** Landscape card that on hover reveals overlay actions (used in most rows). */
export function LandscapeCard({ title, className, addLogo = false, addText = true }: { title: Title; className?: string; addLogo?: boolean; addText?: boolean }) {
  const { open } = useModal()
  const router = useRouter()
  const progress = title.watchProgress

  return (
    <motion.div
      className={cn('group relative w-[230px] shrink-0 sm:w-[260px] md:w-[300px] md:max-lg:w-[270px]', className)}
      whileHover={{ scale: 1.06, zIndex: 30 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => progress && isTitleReleased(title) ? router.push(watchHref(title)) : open(title.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            open(title.id)
          }
        }}
        className="relative block aspect-video w-full cursor-pointer overflow-hidden rounded-md ring-1 ring-white/5"
        aria-label={title.title}
      >
        <TopBadges title={title} />
        <SideBadges title={title} />
        <Image
          src={title.backdrop || '/placeholder.svg'}
          alt={title.title}
          fill
          sizes="300px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent opacity-80 transition-opacity group-hover:opacity-100" />
        {progress && (
          <>
            <div className="absolute inset-x-0 bottom-0 h-1 bg-white/25">
              <div className="h-full bg-primary" style={{ width: `${progress.progressPercent}%` }} />
            </div>
            {title.type === 'tv' && progress.seasonNumber && progress.episodeNumber && (
              <span className="absolute bottom-3 right-3 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                S{progress.seasonNumber}:E{progress.episodeNumber}
              </span>
            )}
          </>
        )}
        <div className="absolute inset-x-0 bottom-0 space-y-1.5 p-3 text-left">
          <CardTitle title={title} addLogo={addLogo} addText={addText} className="line-clamp-1 text-sm font-bold text-balance" />
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="size-2.5 fill-primary text-primary" />
              {title.rating.toFixed(1)}
            </span>
            <span>•</span>
            <span>{title.year}</span>
            <span>•</span>
            <span>{title.type === 'tv' ? 'TV Show' : 'Movie'}</span>
          </div>
          <div className="max-h-0 overflow-hidden opacity-0 transition-all duration-300 group-hover:max-h-16 group-hover:opacity-100">
            <div className="text-[11px]"><MatchScore id={title.id} /></div>
            <div className="pt-1">
              <CardActions title={title} compact />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/** Big numbered Top-10 card (giant outlined rank digit behind a poster). */
export function RankedCard({ title, rank, addLogo = false, addText = true }: { title: Title; rank: number; addLogo?: boolean; addText?: boolean }) {
  const { open } = useModal()

  return (
    <motion.button
      onClick={() => open(title.id)}
      className="group relative flex h-[210px] w-[290px] shrink-0 items-end sm:h-[240px] sm:w-[320px]"
      whileHover={{ scale: 1.04, zIndex: 30 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      aria-label={`${title.title}, ranked number ${rank}`}
    >
      <span
        className="select-none font-heading text-[150px] font-black leading-none text-transparent sm:text-[180px]"
        style={{ WebkitTextStroke: '3px hsl(var(--muted-foreground) / 0.4)' }}
      >
        {rank}
      </span>
      <div className="relative -ml-6 aspect-[2/3] h-full overflow-hidden rounded-md ring-1 ring-white/10">
        <TopBadges title={title} />
        <SideBadges title={title} />
        <Image
          src={title.poster || '/placeholder.svg'}
          alt={title.title}
          fill
          sizes="160px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <CardTitle title={title} addLogo={addLogo} addText={addText} className="absolute inset-x-0 bottom-0 line-clamp-1 p-2 text-xs font-semibold" />
      </div>
    </motion.button>
  )
}
