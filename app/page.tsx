import { PageShell } from '@/components/page-shell'
import { Hero } from '@/components/hero'
import { ContentRow } from '@/components/content-row'
import { featuredTitles, HOME_ROWS } from '@/lib/data'

export default function HomePage() {
  return (
    <PageShell>
      <Hero titles={featuredTitles} />
      <div className="relative z-10 -mt-16 space-y-2 pb-16 md:-mt-24">
        {HOME_ROWS.map((row) => (
          <ContentRow key={row.id} row={row} />
        ))}
      </div>
    </PageShell>
  )
}
