import type { Metadata } from 'next'
import { PageShell } from '@/components/page-shell'
import { BrowserContent } from '@/components/browser-content'
import { Suspense } from 'react'
import { TitleBrowserSkeleton } from '@/components/media-skeletons'
import { sectionMetadata } from '@/lib/site-metadata'

export const revalidate = 60
export const metadata: Metadata = sectionMetadata(
  'Movies',
  'Browse movies on Sceneflix, from popular releases and top-rated films to upcoming titles.',
)

export default function MoviesPage() {
  return (
    <PageShell>
      <Suspense fallback={<TitleBrowserSkeleton heading="Movies" />}>
      <BrowserContent
        heading="Movies"
        fixedType="movie"
        emptyLabel="No movies match this genre yet. Try a different one."
      />
      </Suspense>
    </PageShell>
  )
}
