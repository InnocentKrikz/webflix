'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { LandscapeCard, PortraitCard, RankedCard } from '@/components/media-card'
import { cn } from '@/lib/utils'
import type { Row } from '@/lib/types'

function Toggle({
  value,
  onChange,
}: {
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
              layoutId={`toggle-${opt === 'movie' ? 'a' : 'b'}`}
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

export function ContentRow({ row }: { row: Row }) {
  const scroller = useRef<HTMLDivElement>(null)
  const [filter, setFilter] = useState<'movie' | 'tv'>('movie')

  let titles = row.titles
  if (row.filterable) titles = titles.filter((t) => t.type === filter)

  const scroll = (dir: -1 | 1) => {
    const el = scroller.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' })
  }

  if (titles.length === 0) return null

  return (
    <section className="group/row relative py-3">
      <div className="mb-2 flex items-center gap-3 px-4 md:px-12">
        <h2 className="relative flex items-center gap-2 font-heading text-lg font-bold md:text-xl">
          <span className="h-5 w-1 rounded-full bg-primary" />
          {row.title}
        </h2>
        {row.filterable && <Toggle value={filter} onChange={setFilter} />}
      </div>

      <div className="relative">
        <button
          onClick={() => scroll(-1)}
          aria-label="Scroll left"
          className="absolute left-0 top-0 z-30 hidden h-full w-12 items-center justify-center bg-gradient-to-r from-background to-transparent opacity-0 transition-opacity group-hover/row:opacity-100 md:flex"
        >
          <ChevronLeft className="size-8 transition-transform hover:scale-125" />
        </button>

        <div
          ref={scroller}
          className={cn(
            'no-scrollbar flex gap-2.5 overflow-x-auto scroll-smooth px-4 pb-8 pt-2 md:gap-3 md:px-12',
            row.kind === 'ranked' && 'items-end',
          )}
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
                {row.kind === 'ranked' ? (
                  <RankedCard title={t} rank={i + 1} />
                ) : row.kind === 'top10' ? (
                  <PortraitCard title={t} />
                ) : (
                  <LandscapeCard title={t} />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <button
          onClick={() => scroll(1)}
          aria-label="Scroll right"
          className="absolute right-0 top-0 z-30 hidden h-full w-12 items-center justify-center bg-gradient-to-l from-background to-transparent opacity-0 transition-opacity group-hover/row:opacity-100 md:flex"
        >
          <ChevronRight className="size-8 transition-transform hover:scale-125" />
        </button>
      </div>
    </section>
  )
}
