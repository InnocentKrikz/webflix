import { notFound } from 'next/navigation'
import { VideoPlayer } from '@/components/video-player'
import { getBySlug } from '@/lib/data'

export default async function WatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ s?: string; e?: string }>
}) {
  const { slug } = await params
  const { s, e } = await searchParams
  const title = getBySlug(slug)

  if (!title) notFound()

  return (
    <VideoPlayer
      title={title}
      initialSeason={s ? Number(s) : undefined}
      initialEpisode={e ? Number(e) : undefined}
    />
  )
}
