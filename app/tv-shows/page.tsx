import type { Metadata } from 'next'
import { PageShell } from '@/components/page-shell'
import { TitleBrowser } from '@/components/title-browser'
import { sectionMetadata } from '@/lib/site-metadata'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = sectionMetadata(
  'TV Shows',
  'Browse TV shows on Sceneflix, including popular series, new seasons and binge-worthy favorites.',
)

export default function TvShowsPage() {
  return (
    <PageShell>
      <TitleBrowser
        heading="TV Shows"
        fixedType="tv"
        emptyLabel="No TV shows match this genre yet. Try a different one."
      />
    </PageShell>
  )
}
