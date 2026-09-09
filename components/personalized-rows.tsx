'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ContentRow } from '@/components/content-row'
import { useCatalog } from '@/components/providers'
import { authClient } from '@/lib/auth-client'
import type { Personalization, ProgressItem, Row, Title } from '@/lib/types'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3005'

function titleIdForProgress(item: ProgressItem) {
  return `${item.mediaType === 'TV' ? 'tv' : 'movie'}-${item.tmdbId}`
}

function latestProgressByTitle(progress: ProgressItem[]) {
  const latest = new Map<string, ProgressItem>()
  for (const item of progress) {
    const titleId = titleIdForProgress(item)
    if (!latest.has(titleId)) latest.set(titleId, item)
  }
  return [...latest.values()]
}

function mergeWatchProgress(titles: Title[], progress: ProgressItem[]) {
  const progressByTitle = new Map(latestProgressByTitle(progress).map((item) => [titleIdForProgress(item), item]))
  return titles.map((title) => {
    const watchProgress = progressByTitle.get(title.id)
    return watchProgress ? { ...title, watchProgress } : title
  })
}

export function PersonalizedRows({ children, initialPersonalization = null }: { children?: ReactNode; initialPersonalization?: Personalization | null }) {
  const { data: session, isPending } = authClient.useSession()
  const { registerTitles } = useCatalog()
  const [personalization, setPersonalization] = useState<Personalization | null>(initialPersonalization)
  const [titles, setTitles] = useState(() => mergeWatchProgress(initialPersonalization?.titles ?? [], initialPersonalization?.continueWatching ?? []))

  useEffect(() => {
    registerTitles(titles)
  }, [registerTitles, titles])

  useEffect(() => {
    if (isPending) return
    if (!session) {
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
        const loadedTitles = mergeWatchProgress(data.titles ?? [], data.continueWatching ?? [])
        setTitles(loadedTitles)
        registerTitles(loadedTitles)
      } catch {
        if (!cancelled) setPersonalization(null)
      }
    }

    if (!initialPersonalization) void load()
    const refresh = () => { void load() }
    window.addEventListener('webflix:activity', refresh)
    return () => {
      cancelled = true
      window.removeEventListener('webflix:activity', refresh)
    }
  }, [initialPersonalization, isPending, registerTitles, session])

  const rows = useMemo<Row[]>(() => {
    if (!personalization) return []
    const byId = new Map(titles.map((title) => [title.id, title]))
    const withProgress = latestProgressByTitle(personalization.continueWatching)
      .map((item) => {
        const title = byId.get(item.id)
        return title ? ({ ...title, watchProgress: item } as Title) : null
      })
      .filter((title): title is Title => Boolean(title))

    const recommendationRow = (id: string, title: string, ids: { tmdbId: number; mediaType: 'MOVIE' | 'TV' }[]): Row => ({
      id,
      title,
      kind: 'landscape',
      addLogo: true,
      addText: true,
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
      withProgress.length > 0 ? { id: 'continue-watching', title: 'Continue Watching', kind: 'landscape', addLogo: true, addText: true, titles: withProgress } : null,
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
