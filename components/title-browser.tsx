'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CatalogHydrator } from '@/components/catalog-hydrator'
import { BrowseGrid } from '@/components/browse-grid'
import { GenreChips, SortSelect, TypeToggle, type SortOption } from '@/components/filter-bar'
import type { MediaType, Title } from '@/lib/types'

type BrowserType = MediaType | 'all'

export function TitleBrowser({
  heading,
  fixedType,
  initialGenre = 'All',
  emptyLabel,
}: {
  heading: string
  fixedType?: MediaType
  initialGenre?: string
  emptyLabel: string
}) {
  const [type, setType] = useState<BrowserType>(fixedType ?? 'all')
  const [genre, setGenre] = useState(initialGenre)
  const [sort, setSort] = useState<SortOption>('trending')
  const [genres, setGenres] = useState<string[]>([])
  const [titles, setTitles] = useState<Title[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    const params = new URLSearchParams()
    if (fixedType) params.set('type', fixedType)

    fetch(`/api/genres?${params.toString()}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : []))
      .then((nextGenres: string[]) => setGenres(nextGenres))
      .catch(() => setGenres([]))

    return () => controller.abort()
  }, [fixedType])

  useEffect(() => {
    const controller = new AbortController()
    const params = new URLSearchParams()
    params.set('type', fixedType ?? type)
    params.set('sort', sort)
    if (genre !== 'All') params.set('genre', genre)

    setLoading(true)
    fetch(`/api/titles?${params.toString()}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : []))
      .then((nextTitles: Title[]) => setTitles(nextTitles))
      .catch(() => setTitles([]))
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [fixedType, genre, sort, type])

  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-20 pt-28 md:px-12 md:pt-32">
      <CatalogHydrator titles={titles} />
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
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

      {loading ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
          {Array.from({ length: 14 }).map((_, index) => (
            <div key={index} className="aspect-[2/3] animate-pulse rounded-md bg-secondary" />
          ))}
        </div>
      ) : (
        <BrowseGrid titles={titles} emptyLabel={emptyLabel} />
      )}
    </div>
  )
}
