'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search as SearchIcon } from 'lucide-react'
import { CatalogHydrator } from '@/components/catalog-hydrator'
import { BrowseGrid } from '@/components/browse-grid'
import { BrowseGridSkeleton } from '@/components/media-skeletons'
import { fetchCatalog } from '@/lib/catalog-client'
import type { Title } from '@/lib/types'

export function SearchContent({ initialServerQuery, initialTitles }: { initialServerQuery: string; initialTitles: Title[] }) {
  const params = useSearchParams()
  const initialQuery = params.get('q') ?? ''
  const [query, setQuery] = useState(initialQuery)
  const [titles, setTitles] = useState<Title[]>(initialTitles)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setTitles([])
      setLoading(false)
      return
    }

    if (query === initialServerQuery) {
      setTitles(initialTitles)
      setLoading(false)
      return
    }
    const controller = new AbortController()
    setLoading(true)
    const timeout = setTimeout(() => {
      const searchParams = new URLSearchParams({ query: trimmed })
      fetchCatalog<Title[]>(`/api/titles?${searchParams.toString()}`, controller.signal)
        .then((nextTitles: Title[]) => {
          if (!controller.signal.aborted) setTitles(nextTitles)
        })
        .catch(() => {
          if (!controller.signal.aborted) setTitles([])
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false)
        })
    }, 250)

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [query, initialServerQuery, initialTitles])

  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-20 pt-28 md:px-12 md:pt-32">
      <CatalogHydrator titles={titles} />
      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="mb-4 font-display text-3xl font-extrabold tracking-tight md:text-4xl">Search</h1>
        <div className="relative max-w-xl">
          <SearchIcon className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles, genres, people…"
            className="h-12 w-full rounded-full border border-white/15 bg-secondary pl-12 pr-5 text-base outline-none placeholder:text-muted-foreground focus:border-primary"
          />
        </div>
      </motion.div>

      {query.trim() ? (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            {loading
              ? `Searching for "${query}"`
              : `${titles.length} result${titles.length === 1 ? '' : 's'} for "${query}"`}
          </p>
          {loading && titles.length === 0 ? (
            <BrowseGridSkeleton />
          ) : (
            <BrowseGrid titles={titles} emptyLabel="Try searching a different title, genre, or cast member." />
          )}
        </>
      ) : (
        <p className="py-16 text-center text-muted-foreground">Start typing to search the Sceneflix catalog.</p>
      )}
    </div>
  )
}
