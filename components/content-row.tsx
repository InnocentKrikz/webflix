'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { LandscapeCard, PortraitCard, RankedCard } from '@/components/media-card'
import { ShowcaseRow } from '@/components/showcase-row'
import { MediaGlowBoundary } from '@/components/media-card-glow'
import { useEffects } from '@/components/providers'
import { cn } from '@/lib/utils'
import type { Row } from '@/lib/types'

function Toggle({
  groupId,
  value,
  onChange,
}: {
  groupId: string
  value: 'movie' | 'tv'
  onChange: (v: 'movie' | 'tv') => void
}) {
  return (
    <div className="relative flex items-center rounded-full bg-secondary p-0.5 text-xs font-semibold">
      {(['movie', 'tv'] as const).map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className="relative z-10 rounded-full px-3 py-1 transition-colors"
        >
          {value === opt && (
            <motion.span
              layoutId={`toggle-${groupId}-${opt}`}
              className="absolute inset-0 -z-10 rounded-full bg-foreground"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className={cn(value === opt ? 'text-background' : 'text-muted-foreground')}>
            {opt === 'movie' ? 'Movies' : 'Series'}
          </span>
        </button>
      ))}
    </div>
  )
}

function StandardContentRow({ row }: { row: Row }) {
  const scroller = useRef<HTMLDivElement>(null)
  const { reducedEffects } = useEffects()
  const [filter, setFilter] = useState<'movie' | 'tv'>('movie')
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const variant = row.filterable ? row.variants?.[filter] : undefined
  const title = variant?.title ?? row.title
  const kind = variant?.kind ?? row.kind
  const addLogo = variant?.addLogo ?? row.addLogo ?? false
  const addText = variant?.addText ?? row.addText ?? true
  let titles = variant?.titles ?? row.titles
  if (row.filterable && !variant) titles = titles.filter((t) => t.type === filter)

  const scroll = (dir: -1 | 1) => {
    const el = scroller.current
    if (!el) return
    el.scrollBy({
      left: dir * el.clientWidth * 0.85,
      behavior: reducedEffects ? 'auto' : 'smooth',
    })
  }

  const updateScrollState = useCallback(() => {
    const el = scroller.current
    if (!el) return

    const maxScrollLeft = Math.max(0, el.scrollWidth - el.clientWidth)
    setCanScrollLeft(el.scrollLeft > 1)
    setCanScrollRight(el.scrollLeft < maxScrollLeft - 1)
  }, [])

  useEffect(() => {
    const el = scroller.current
    if (!el) return

    updateScrollState()
    const observer = new ResizeObserver(updateScrollState)
    observer.observe(el)

    return () => observer.disconnect()
  }, [filter, row.id, titles.length, updateScrollState])

  if (titles.length === 0) return null

  return (
    <section className="group/row relative z-10 overflow-visible py-3 md:max-2xl:py-2">
      <div className="mb-2 flex items-center gap-3 px-4 md:px-12 md:max-2xl:mb-1 md:max-2xl:px-8">
        <h2 className="relative flex items-center gap-2 font-heading text-lg font-bold md:text-xl">
          <span className="h-5 w-1 rounded-full bg-primary" />
          {title}
        </h2>
        {row.filterable && <Toggle groupId={row.id} value={filter} onChange={setFilter} />}
      </div>

      <MediaGlowBoundary className="relative isolate mx-4 overflow-visible md:mx-12 md:max-2xl:mx-8">
        {canScrollLeft && (
          <button
            onClick={() => scroll(-1)}
            aria-label="Scroll left"
            className="absolute left-0 top-0 z-30 hidden h-full w-12 items-center justify-center bg-gradient-to-r from-background to-transparent opacity-0 transition-opacity group-hover/row:opacity-100 md:flex"
          >
            <ChevronLeft className="size-8 transition-transform hover:scale-125" />
          </button>
        )}

        <div
          ref={scroller}
          onScroll={updateScrollState}
          className={cn('no-scrollbar relative flex gap-2.5 overflow-x-auto overscroll-x-contain scroll-smooth px-3 pb-8 pt-2 md:gap-3 md:max-2xl:gap-2.5 md:max-2xl:pb-6 md:max-2xl:pt-1', kind === 'ranked' && 'items-end')}
        >
          <AnimatePresence mode="popLayout">
            {titles.map((t, i) => (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: Math.min(i * 0.04, 0.4) }}
              >
                {kind === 'ranked' ? (
                  <RankedCard title={t} rank={i + 1} addLogo={addLogo} addText={addText} />
                ) : kind === 'top10' ? (
                  <PortraitCard title={t} addLogo={addLogo} addText={addText} />
                ) : (
                  <LandscapeCard title={t} addLogo={addLogo} addText={addText} />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {canScrollRight && (
          <button
            onClick={() => scroll(1)}
            aria-label="Scroll right"
            className="absolute right-0 top-0 z-30 hidden h-full w-12 items-center justify-center bg-gradient-to-l from-background to-transparent opacity-0 transition-opacity group-hover/row:opacity-100 md:flex"
          >
            <ChevronRight className="size-8 transition-transform hover:scale-125" />
          </button>
        )}
      </MediaGlowBoundary>
    </section>
  )
}

export function ContentRow({ row }: { row: Row }) {
  return row.kind === 'showcase' ? <ShowcaseRow row={row} /> : <StandardContentRow row={row} />
}
