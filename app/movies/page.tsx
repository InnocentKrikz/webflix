import { PageShell } from '@/components/page-shell'
import { TitleBrowser } from '@/components/title-browser'

export const dynamic = 'force-dynamic'

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
