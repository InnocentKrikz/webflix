import type { Metadata } from 'next'
import { PageShell } from '@/components/page-shell'
import { BrowserContent } from '@/components/browser-content'
import { Suspense } from 'react'
import { TitleBrowserSkeleton } from '@/components/media-skeletons'
import { sectionMetadata } from '@/lib/site-metadata'

export const revalidate = 60
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
      <Suspense fallback={<TitleBrowserSkeleton heading="Browse" />}>
      <BrowserContent
        heading="Browse"
        initialGenre={genre ?? 'All'}
        emptyLabel="Try switching type, genre, or sort order."
      />
      </Suspense>
    </PageShell>
  )
}
