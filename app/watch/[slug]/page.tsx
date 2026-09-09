import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProviderPlayer } from '@/components/viduki-player'
import { getWatchTitle } from '@/lib/data'
import { resolvePlayback } from '@/lib/availability'
import { ComingSoon } from '@/components/coming-soon'
import { titleMetadata } from '@/lib/site-metadata'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ s?: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const { s } = await searchParams
  const seasonNumber = s && /^[1-9]\d*$/.test(s) ? Number(s) : undefined
  const title = await getWatchTitle(slug, seasonNumber)
  return title ? titleMetadata(title) : {}
}

export default async function WatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ s?: string; e?: string }>
}) {
  const { slug } = await params
  const { s, e } = await searchParams
  if ((s !== undefined && !/^[1-9]\d*$/.test(s)) || (e !== undefined && !/^[1-9]\d*$/.test(e))) notFound()
  const seasonNumber = s ? Number(s) : undefined
  const episodeNumber = e ? Number(e) : undefined
  const title = await getWatchTitle(slug, seasonNumber)

  if (!title) notFound()
  if (!resolvePlayback(title, seasonNumber, episodeNumber)) {
    return <ComingSoon title={title} seasonNumber={seasonNumber} episodeNumber={episodeNumber} />
  }

  return (
    <ProviderPlayer
      title={title}
      initialSeason={seasonNumber}
      initialEpisode={episodeNumber}
    />
  )
}
