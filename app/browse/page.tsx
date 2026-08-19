'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Radio } from 'lucide-react'
import { PageShell } from '@/components/page-shell'
import { BrowseGrid } from '@/components/browse-grid'
import { GenreChips, SortSelect, TypeToggle, type SortOption } from '@/components/filter-bar'
import { filterTitles, GENRES } from '@/lib/data'

const LIVE_CHANNELS = [
  { name: 'Webflix News 24', tag: 'News', viewers: '128K watching' },
  { name: 'Arena Sports 1', tag: 'Sports', viewers: '76K watching' },
  { name: 'Cinema Classics', tag: 'Movies', viewers: '41K watching' },
  { name: 'Kids & Family Live', tag: 'Family', viewers: '19K watching' },
]

function LiveTV() {
  return (
    <div className="mb-10">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex items-center gap-1.5 rounded bg-primary px-2 py-1 text-xs font-bold uppercase tracking-wide text-primary-foreground">
          <span className="size-1.5 animate-pulse rounded-full bg-primary-foreground" />
          Live
        </span>
        <h2 className="font-heading text-xl font-bold">On Now</h2>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {LIVE_CHANNELS.map((c, i) => (
          <motion.div
            key={c.name}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="group relative overflow-hidden rounded-lg bg-card ring-1 ring-white/10"
          >
            <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-secondary to-background">
              <Radio className="size-8 text-muted-foreground transition-transform group-hover:scale-110" />
              <span className="absolute left-2 top-2 flex items-center gap-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">
                Live
              </span>
            </div>
            <div className="p-3">
              <p className="text-sm font-semibold">{c.name}</p>
              <p className="text-xs text-muted-foreground">
                {c.tag} · {c.viewers}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function BrowseContent() {
  const params = useSearchParams()
  const [type, setType] = useState<'all' | 'movie' | 'tv'>('all')
  const [genre, setGenre] = useState('All')
  const [sort, setSort] = useState<SortOption>('trending')
  const [showLive, setShowLive] = useState(false)

  useEffect(() => {
    const g = params.get('genre')
    const tab = params.get('tab')
    if (g && (GENRES as readonly string[]).includes(g)) setGenre(g)
    setShowLive(tab === 'live')
  }, [params])

  const titles = useMemo(
    () => filterTitles({ type, genre, sort }),
    [type, genre, sort],
  )

  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-20 pt-28 md:px-12 md:pt-32">
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6 font-display text-3xl font-extrabold tracking-tight md:text-4xl"
      >
        Browse
      </motion.h1>

      {showLive && <LiveTV />}

      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TypeToggle value={type} onChange={setType} />
          <SortSelect value={sort} onChange={setSort} />
        </div>
        <GenreChips genres={[...GENRES]} active={genre} onChange={setGenre} />
      </div>

      <BrowseGrid titles={titles} emptyLabel="Try switching type, genre, or sort order." />
    </div>
  )
}

export default function BrowsePage() {
  return (
    <PageShell>
      <Suspense
        fallback={
          <div className="mx-auto max-w-[1600px] px-4 pb-20 pt-28 md:px-12 md:pt-32">
            <div className="h-10 w-40 animate-pulse rounded bg-secondary" />
          </div>
        }
      >
        <BrowseContent />
      </Suspense>
    </PageShell>
  )
}
