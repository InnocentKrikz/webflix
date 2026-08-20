import { PageShell } from '@/components/page-shell'
import { TitleBrowser } from '@/components/title-browser'

export const dynamic = 'force-dynamic'

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
