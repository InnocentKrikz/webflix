import { Fragment, Suspense } from 'react'
import { PageShell } from '@/components/page-shell'
import { CatalogHydrator } from '@/components/catalog-hydrator'
import { TopTenProvider } from '@/components/top-ten-provider'
import { Hero } from '@/components/hero'
import { ContentRow } from '@/components/content-row'
import { PersonalizedRows, TrendingGenreRows } from '@/components/personalized-rows'
import { ProductionCompanyRow } from '@/components/production-company-row'
import { HomePageSkeleton, ContentRowSkeleton } from '@/components/media-skeletons'
import { getHomeData, getHomeGenreData } from '@/lib/data'

export const revalidate = 60

type HomeData = Awaited<ReturnType<typeof getHomeData>>

function PrimaryContent({ data }: { data: HomeData }) {
  const { featuredTitles, rows, titles } = data
  return <>
    <CatalogHydrator titles={titles} />
    <Hero titles={featuredTitles} />
    {/* Keep Top 10 and its cards above the trailer light spilling up from the
        secondary section. Both wrappers are transparent between cards. */}
    <div className="relative z-20 -mt-16 space-y-2 md:-mt-24 md:max-2xl:-mt-28 md:max-2xl:space-y-0">
      <PersonalizedRows />
      {rows.filter((row) => row.id === 'trending' || row.id === 'top-10').map((row) => <ContentRow key={row.id} row={row} />)}
    </div>
  </>
}

async function SecondaryContent({ data }: { data: Promise<HomeData> }) {
  const { rows, titles, productionCompanies } = await data
  return <>
    <CatalogHydrator titles={titles} />
    {rows.filter((row) => row.titles.length > 0).map((row) => (
      <Fragment key={row.id}>
        {row.id === 'now-playing' && <ProductionCompanyRow companies={productionCompanies} />}
        <ContentRow row={row} />
      </Fragment>
    ))}
  </>
}

async function GenreContent({ data }: { data: ReturnType<typeof getHomeGenreData> }) {
  return <TrendingGenreRows data={await data} />
}

async function HomeContent({ primary, secondary, genres }: {
  primary: Promise<HomeData>
  secondary: Promise<HomeData>
  genres: ReturnType<typeof getHomeGenreData>
}) {
  const data = await primary
  const topTenIds = data.rows.find((row) => row.id === 'top-10')?.titles.map((title) => title.id) ?? []

  return <TopTenProvider ids={topTenIds}>
    <PrimaryContent data={data} />
    <div className="relative z-10 space-y-2 pb-16">
      <Suspense fallback={<ContentRowSkeleton />}><SecondaryContent data={secondary} /></Suspense>
      <Suspense fallback={<ContentRowSkeleton />}><GenreContent data={genres} /></Suspense>
    </div>
  </TopTenProvider>
}

export default function HomePage() {
  const primary = getHomeData('primary')
  const secondary = getHomeData('secondary')
  const genres = getHomeGenreData()

  return <PageShell>
    <Suspense fallback={<HomePageSkeleton />}>
      <HomeContent primary={primary} secondary={secondary} genres={genres} />
    </Suspense>
  </PageShell>
}
