import type { Metadata } from 'next'
import { PageShell } from '@/components/page-shell'
import { BrowserContent } from '@/components/browser-content'
import { Suspense } from 'react'
import { TitleBrowserSkeleton } from '@/components/media-skeletons'
import { sectionMetadata } from '@/lib/site-metadata'

export const revalidate = 60
export const metadata: Metadata = sectionMetadata(
  'TV Shows',
  'Browse TV shows on Sceneflix, including popular series, new seasons and binge-worthy favorites.',
)

export default function TvShowsPage() {
  return (
    <PageShell>
      <Suspense fallback={<TitleBrowserSkeleton heading="TV Shows" />}>
      <BrowserContent
        heading="TV Shows"
        fixedType="tv"
        emptyLabel="No TV shows match this genre yet. Try a different one."
      />
      </Suspense>
    </PageShell>
  )
}
