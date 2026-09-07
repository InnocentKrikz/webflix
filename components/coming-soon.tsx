import Image from 'next/image'
import Link from 'next/link'
import type { Title } from '@/lib/types'

export function ComingSoon({ title, seasonNumber, episodeNumber }: { title: Title; seasonNumber?: number; episodeNumber?: number }) {
  return (
    <main className="relative grid min-h-screen place-items-center bg-background p-6 text-center">
      <Image src={title.backdrop || title.poster || '/placeholder.svg'} alt="" fill sizes="100vw" className="object-cover opacity-25" />
      <div className="relative max-w-lg space-y-4">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Coming Soon</p>
        <h1 className="font-display text-4xl font-bold">{title.title}</h1>
        {seasonNumber !== undefined && <p>Season {seasonNumber}{episodeNumber !== undefined ? ` · Episode ${episodeNumber}` : ''}</p>}
        <p className="text-muted-foreground">This {title.type === 'movie' ? 'movie' : episodeNumber !== undefined ? 'episode' : seasonNumber !== undefined ? 'season' : 'show'} is not available to watch yet.</p>
        <Link href={title.type === 'movie' ? '/movies' : '/tv-shows'} className="inline-flex rounded-full bg-foreground px-6 py-3 font-semibold text-background">Back to browse</Link>
      </div>
    </main>
  )
}
