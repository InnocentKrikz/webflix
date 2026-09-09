import type { Metadata } from 'next'
import { PageShell } from '@/components/page-shell'
import { TitleBrowser } from '@/components/title-browser'
import { sectionMetadata } from '@/lib/site-metadata'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = sectionMetadata(
  'Movies',
  'Browse movies on Sceneflix, from popular releases and top-rated films to upcoming titles.',
)

export default function MoviesPage() {
  return (
    <PageShell>
      <TitleBrowser
        heading="Movies"
        fixedType="movie"
        emptyLabel="No movies match this genre yet. Try a different one."
      />
    </PageShell>
  )
}
