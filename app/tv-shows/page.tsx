import { PageShell } from '@/components/page-shell'
import { TitleBrowser } from '@/components/title-browser'

export const dynamic = 'force-dynamic'

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
