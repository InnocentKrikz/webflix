'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ContentRow } from '@/components/content-row'
import { useCatalog } from '@/components/providers'
import { authClient } from '@/lib/auth-client'
import type { Row, Title } from '@/lib/types'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3005'

type ProgressItem = {
  id: string
  mediaType: 'MOVIE' | 'TV'
  tmdbId: number
  seasonNumber?: number | null
  episodeNumber?: number | null
  progressSeconds: number
  durationSeconds: number
  progressPercent: number
}

type Personalization = {
  continueWatching: ProgressItem[]
  becauseWatched: { title: string; ids: { tmdbId: number; mediaType: 'MOVIE' | 'TV' }[] } | null
  becauseActors: { actors: { id: number; name: string }[]; ids: { tmdbId: number; mediaType: 'MOVIE' | 'TV' }[] } | null
  genres: { id: number; name: string; movieIds: number[]; tvIds: number[] }[]
}

function idsFor(items: { tmdbId: number; mediaType: 'MOVIE' | 'TV' }[]) {
  return items.map((item) => `${item.mediaType === 'TV' ? 'tv' : 'movie'}-${item.tmdbId}`)
}

export function PersonalizedRows({ children }: { children?: ReactNode }) {
  const { data: session, isPending } = authClient.useSession()
  const { registerTitles } = useCatalog()
  const [personalization, setPersonalization] = useState<Personalization | null>(null)
  const [titles, setTitles] = useState<Title[]>([])

  useEffect(() => {
    if (isPending || !session) {
      setPersonalization(null)
      setTitles([])
      return
    }

    let cancelled = false
    const load = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/progress`, { credentials: 'include' })
        if (!response.ok) return
        const data = (await response.json()) as Personalization
        if (cancelled) return
        setPersonalization(data)

        const titleGroups = [
          data.continueWatching.map((item) => item.id),
          idsFor(data.becauseWatched?.ids ?? []),
          idsFor(data.becauseActors?.ids ?? []),
          ...data.genres.map((genre) => [
            ...genre.movieIds.map((tmdbId) => `movie-${tmdbId}`),
            ...genre.tvIds.map((tmdbId) => `tv-${tmdbId}`),
          ]),
        ].filter((ids) => ids.length > 0)

        const titleResponses = await Promise.all(
          titleGroups.map(async (ids) => {
            const titlesResponse = await fetch(`/api/titles?ids=${encodeURIComponent(Array.from(new Set(ids)).join(','))}`)
            return titlesResponse.ok ? (await titlesResponse.json()) as Title[] : []
          }),
        )
        if (!cancelled) {
          const uniqueTitles = new Map<string, Title>()
          for (const group of titleResponses) {
            for (const title of group) uniqueTitles.set(title.id, title)
          }
          const loadedTitles = [...uniqueTitles.values()]
          setTitles(loadedTitles)
          registerTitles(loadedTitles)
        }
      } catch {
        if (!cancelled) setPersonalization(null)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [isPending, registerTitles, session])

  const rows = useMemo<Row[]>(() => {
    if (!personalization) return []
    const byId = new Map(titles.map((title) => [title.id, title]))
    const withProgress = personalization.continueWatching
      .map((item) => {
        const title = byId.get(item.id)
        return title ? ({ ...title, watchProgress: item } as Title) : null
      })
      .filter((title): title is Title => Boolean(title))

    const recommendationRow = (id: string, title: string, ids: { tmdbId: number; mediaType: 'MOVIE' | 'TV' }[]): Row => ({
      id,
      title,
      kind: 'landscape',
      titles: ids.map((item) => byId.get(`${item.mediaType === 'TV' ? 'tv' : 'movie'}-${item.tmdbId}`)).filter((item): item is Title => Boolean(item)),
    })

    const genreRows = personalization.genres.map((genre) => ({
      id: `genre-${genre.id}`,
      title: `More ${genre.name}`,
      kind: 'landscape' as const,
      addLogo: true,
      addText: true,
      titles: [...genre.movieIds.map((tmdbId) => byId.get(`movie-${tmdbId}`)), ...genre.tvIds.map((tmdbId) => byId.get(`tv-${tmdbId}`))].filter((item): item is Title => Boolean(item)),
      filterable: true,
      variants: {
        movie: { title: `${genre.name} Movies`, kind: 'landscape' as const, titles: genre.movieIds.map((tmdbId) => byId.get(`movie-${tmdbId}`)).filter((item): item is Title => Boolean(item)) },
        tv: { title: `${genre.name} TV Shows`, kind: 'landscape' as const, titles: genre.tvIds.map((tmdbId) => byId.get(`tv-${tmdbId}`)).filter((item): item is Title => Boolean(item)) },
      },
    }))

    return [
      withProgress.length > 0 ? { id: 'continue-watching', title: 'Continue Watching', kind: 'landscape', titles: withProgress } : null,
      personalization.becauseWatched ? recommendationRow('because-watched', `Because you watched ${personalization.becauseWatched.title}`, personalization.becauseWatched.ids) : null,
      personalization.becauseActors ? recommendationRow('because-actors', `Because you watched ${personalization.becauseActors.actors.map((actor) => actor.name).join(' & ')}`, personalization.becauseActors.ids) : null,
      ...genreRows,
    ].filter((row) => row !== null && row.titles.length > 0) as Row[]
  }, [personalization, titles])

  const topRows = rows.filter((row) => !row.id.startsWith('genre-'))
  const genreRows = rows.filter((row) => row.id.startsWith('genre-'))

  return (
    <>
      {topRows.length > 0 && (
        <div className="space-y-2">
          {topRows.map((row) => <ContentRow key={row.id} row={row} />)}
        </div>
      )}
      {children}
      {genreRows.length > 0 && (
        <div className="space-y-2">
          {genreRows.map((row) => <ContentRow key={row.id} row={row} />)}
        </div>
      )}
    </>
  )
}
