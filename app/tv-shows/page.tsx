'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { PageShell } from '@/components/page-shell'
import { BrowseGrid } from '@/components/browse-grid'
import { GenreChips, SortSelect, type SortOption } from '@/components/filter-bar'
import { filterTitles, GENRES } from '@/lib/data'

export default function TvShowsPage() {
  const [genre, setGenre] = useState('All')
  const [sort, setSort] = useState<SortOption>('trending')

  const titles = useMemo(
    () => filterTitles({ type: 'tv', genre, sort }),
    [genre, sort],
  )

  return (
    <PageShell>
      <div className="mx-auto max-w-[1600px] px-4 pb-20 pt-28 md:px-12 md:pt-32">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 font-display text-3xl font-extrabold tracking-tight md:text-4xl"
        >
          TV Shows
        </motion.h1>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <GenreChips genres={[...GENRES]} active={genre} onChange={setGenre} />
          <SortSelect value={sort} onChange={setSort} />
        </div>

        <BrowseGrid titles={titles} emptyLabel="No TV shows match this genre yet — try a different one." />
      </div>
    </PageShell>
  )
}
