import { notFound } from 'next/navigation'
import { VideoPlayer } from '@/components/video-player'
import { getWatchTitle } from '@/lib/data'
import { resolvePlayback } from '@/lib/availability'
import { ComingSoon } from '@/components/coming-soon'

export const dynamic = 'force-dynamic'

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
    <VideoPlayer
      title={title}
      initialSeason={seasonNumber}
      initialEpisode={episodeNumber}
    />
  )
}
