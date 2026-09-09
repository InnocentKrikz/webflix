import type { Metadata } from 'next'
import { PageShell } from '@/components/page-shell'
import { TitleBrowser } from '@/components/title-browser'
import { sectionMetadata } from '@/lib/site-metadata'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = sectionMetadata(
  'Browse',
  'Explore the Sceneflix catalog by movie, TV show, genre, popularity and release year.',
)

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ genre?: string }>
}) {
  const { genre } = await searchParams

  return (
    <PageShell>
      <TitleBrowser
        heading="Browse"
        initialGenre={genre ?? 'All'}
        emptyLabel="Try switching type, genre, or sort order."
      />
    </PageShell>
  )
}
