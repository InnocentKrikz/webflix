'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search as SearchIcon } from 'lucide-react'
import { CatalogHydrator } from '@/components/catalog-hydrator'
import { PageShell } from '@/components/page-shell'
import { BrowseGrid } from '@/components/browse-grid'
import type { Title } from '@/lib/types'

function SearchContent() {
  const params = useSearchParams()
  const initialQuery = params.get('q') ?? ''
  const [query, setQuery] = useState(initialQuery)
  const [titles, setTitles] = useState<Title[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setTitles([])
      setLoading(false)
      return
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => {
      setLoading(true)
      const searchParams = new URLSearchParams({ query: trimmed })
      fetch(`/api/titles?${searchParams.toString()}`, { signal: controller.signal })
        .then((response) => (response.ok ? response.json() : []))
        .then((nextTitles: Title[]) => setTitles(nextTitles))
        .catch(() => setTitles([]))
        .finally(() => setLoading(false))
    }, 250)

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [query])

  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-20 pt-28 md:px-12 md:pt-32">
      <CatalogHydrator titles={titles} />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
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
          <BrowseGrid titles={titles} emptyLabel="Try searching a different title, genre, or cast member." />
        </>
      ) : (
        <p className="py-16 text-center text-muted-foreground">Start typing to search the Webflix catalog.</p>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <PageShell>
      <Suspense
        fallback={
          <div className="mx-auto max-w-[1600px] px-4 pb-20 pt-28 md:px-12 md:pt-32">
            <div className="h-10 w-40 animate-pulse rounded bg-secondary" />
          </div>
        }
      >
        <SearchContent />
      </Suspense>
    </PageShell>
  )
}
