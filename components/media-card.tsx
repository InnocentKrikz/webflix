'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { useModal } from '@/components/providers'
import { CardActions } from '@/components/card-actions'
import { MaturityTag, QualityTag } from '@/components/pieces'
import { cn } from '@/lib/utils'
import type { Title } from '@/lib/types'

function Badge({ title }: { title: Title }) {
  if (!title.badge) return null
  const isTop = title.badge === 'Top 10'
  return (
    <span
      className={cn(
        'absolute left-0 top-2 z-10 rounded-r px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
        isTop ? 'bg-primary text-primary-foreground' : 'bg-primary text-primary-foreground',
      )}
    >
      {isTop ? (
        <span className="flex flex-col items-center leading-none">
          <span className="text-[8px]">TOP</span>
          <span>10</span>
        </span>
      ) : (
        title.badge
      )}
    </span>
  )
}

/**
 * Signature card: shows a PORTRAIT poster at rest, and on hover expands into a
 * wider LANDSCAPE preview with backdrop art, meta and action buttons.
 */
export function PortraitCard({ title, className }: { title: Title; className?: string }) {
  const { open } = useModal()

  return (
    <motion.div
      className={cn('group relative z-0 w-[150px] shrink-0 sm:w-[170px] md:w-[185px]', className)}
      whileHover={{ zIndex: 40 }}
    >
      {/* Resting portrait poster */}
      <motion.button
        onClick={() => open(title.id)}
        className="relative block aspect-[2/3] w-full overflow-hidden rounded-md ring-1 ring-white/5"
        aria-label={title.title}
      >
        <Badge title={title} />
        <Image
          src={title.poster || '/placeholder.svg'}
          alt={title.title}
          fill
          sizes="185px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-2">
          <p className="line-clamp-1 text-xs font-semibold text-balance">{title.title}</p>
          <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
            <Star className="size-2.5 fill-primary text-primary" />
            {title.rating.toFixed(1)}
          </div>
        </div>
      </motion.button>

      {/* Expanded landscape preview on hover (desktop) */}
      <motion.div
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
            onClick={() => open(title.id)}
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
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
          </button>
          <div className="space-y-2 p-3">
            <CardActions title={title} />
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
              <span className="font-semibold text-emerald-400">{Math.round(title.rating * 10)}% Match</span>
              <MaturityTag maturity={title.maturity} />
              <span className="text-muted-foreground">{title.type === 'tv' ? `${title.seasons?.length} Seasons` : title.runtime}</span>
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
      </motion.div>
    </motion.div>
  )
}

/** Landscape card that on hover reveals overlay actions (used in most rows). */
export function LandscapeCard({ title, className }: { title: Title; className?: string }) {
  const { open } = useModal()

  return (
    <motion.div
      className={cn('group relative w-[230px] shrink-0 sm:w-[260px] md:w-[300px]', className)}
      whileHover={{ scale: 1.06, zIndex: 30 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => open(title.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            open(title.id)
          }
        }}
        className="relative block aspect-video w-full cursor-pointer overflow-hidden rounded-md ring-1 ring-white/5"
        aria-label={title.title}
      >
        <Badge title={title} />
        <Image
          src={title.backdrop || '/placeholder.svg'}
          alt={title.title}
          fill
          sizes="300px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent opacity-80 transition-opacity group-hover:opacity-100" />
        <div className="absolute inset-x-0 bottom-0 space-y-1.5 p-3 text-left">
          <p className="line-clamp-1 text-sm font-bold text-balance">{title.title}</p>
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
export function RankedCard({ title, rank }: { title: Title; rank: number }) {
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
        <Image
          src={title.poster || '/placeholder.svg'}
          alt={title.title}
          fill
          sizes="160px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <p className="absolute inset-x-0 bottom-0 line-clamp-1 p-2 text-xs font-semibold">{title.title}</p>
      </div>
    </motion.button>
  )
}
