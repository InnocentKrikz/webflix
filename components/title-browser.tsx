'use client'

import { useEffect, useState } from 'react'
import { fetchCatalog } from '@/lib/catalog-client'
import { motion } from 'framer-motion'
import { CatalogHydrator } from '@/components/catalog-hydrator'
import { BrowseGrid } from '@/components/browse-grid'
import { GenreChips, SortSelect, TypeToggle, type SortOption } from '@/components/filter-bar'
import { BrowseGridSkeleton } from '@/components/title-browser-skeleton'
import type { MediaType, Title } from '@/lib/types'

type BrowserType = MediaType | 'all'

export function TitleBrowser({
  heading,
  fixedType,
  initialGenre = 'All',
  emptyLabel,
  initialTitles,
  initialGenres,
}: {
  heading: string
  fixedType?: MediaType
  initialGenre?: string
  emptyLabel: string
  initialTitles: Title[]
  initialGenres: string[]
}) {
  const [type, setType] = useState<BrowserType>(fixedType ?? 'all')
  const [genre, setGenre] = useState(initialGenre)
  const [sort, setSort] = useState<SortOption>('trending')
  const genres = initialGenres
  const [titles, setTitles] = useState(initialTitles)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (type === (fixedType ?? 'all') && genre === initialGenre && sort === 'trending') {
      setTitles(initialTitles)
      setLoading(false)
      return
    }
    const controller = new AbortController()
    const params = new URLSearchParams()
    params.set('type', fixedType ?? type)
    params.set('sort', sort)
    if (genre !== 'All') params.set('genre', genre)

    setLoading(true)
    fetchCatalog<Title[]>(`/api/titles?${params.toString()}`, controller.signal)
      .then((nextTitles: Title[]) => {
        if (!controller.signal.aborted) setTitles(nextTitles)
      })
      .catch(() => {
        if (!controller.signal.aborted) setTitles([])
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [fixedType, genre, sort, type, initialGenre, initialTitles])

  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-20 pt-28 md:px-12 md:pt-32">
      <CatalogHydrator titles={titles} />
      <motion.h1
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6 font-display text-3xl font-extrabold tracking-tight md:text-4xl"
      >
        {heading}
      </motion.h1>

      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {!fixedType && <TypeToggle value={type} onChange={setType} />}
          <SortSelect value={sort} onChange={setSort} />
        </div>
        <GenreChips genres={genres} active={genre} onChange={setGenre} />
      </div>

      <div aria-busy={loading}>
      {loading && titles.length === 0 ? (
        <BrowseGridSkeleton />
      ) : (
        <BrowseGrid titles={titles} emptyLabel={emptyLabel} />
      )}
      </div>
    </div>
  )
}
