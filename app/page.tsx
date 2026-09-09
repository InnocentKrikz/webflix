import { Fragment } from 'react'
import { PageShell } from '@/components/page-shell'
import { CatalogHydrator } from '@/components/catalog-hydrator'
import { Hero } from '@/components/hero'
import { ContentRow } from '@/components/content-row'
import { PersonalizedRows } from '@/components/personalized-rows'
import { ProductionCompanyRow } from '@/components/production-company-row'
import { getHomeData } from '@/lib/data'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const { featuredTitles, rows, titles, personalization, trendingGenreRecommendations, productionCompanies } = await getHomeData()

  return (
    <PageShell>
      <CatalogHydrator titles={titles} />
      <Hero titles={featuredTitles} />
      <div className="relative z-10 -mt-16 space-y-2 pb-16 md:-mt-24 md:max-2xl:-mt-28 md:max-2xl:space-y-0">
        <PersonalizedRows
          initialPersonalization={personalization}
          initialTrendingGenreRecommendations={trendingGenreRecommendations}
        >
          {rows.map((row) => (
            <Fragment key={row.id}>
              {row.id === 'now-playing' && <ProductionCompanyRow companies={productionCompanies} />}
              <ContentRow row={row} />
            </Fragment>
          ))}
        </PersonalizedRows>
      </div>
    </PageShell>
  )
}
