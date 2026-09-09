import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BrowseGrid } from '@/components/browse-grid'
import { CatalogHydrator } from '@/components/catalog-hydrator'
import { ContentRow } from '@/components/content-row'
import { PageShell } from '@/components/page-shell'
import { getProductionCompany } from '@/lib/data'
import { productionCompanyMetadata } from '@/lib/site-metadata'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id: rawId } = await params
  const company = await getProductionCompany(Number(rawId))
  return company ? productionCompanyMetadata(company) : {}
}

export default async function ProductionCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params
  const company = await getProductionCompany(Number(rawId))
  if (!company) notFound()

  const titles = [...company.movies, ...company.tvShows]

  return (
    <PageShell>
      <div className="mx-auto max-w-[1600px] px-4 pb-20 pt-28 md:px-12 md:pt-32">
        <Link href="/browse" className="mb-8 inline-flex text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
          ← Back to Browse
        </Link>

        <section className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="relative flex size-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-5 ring-1 ring-white/10 sm:size-40">
            {company.logo ? (
              <Image src={company.logo} alt={company.name} fill sizes="160px" className="object-contain p-5" />
            ) : (
              <span className="text-center text-xs font-bold uppercase text-black/60">Production Company</span>
            )}
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Production Company</p>
            <h1 className="font-display text-4xl font-extrabold tracking-tight md:text-6xl">{company.name}</h1>
            {company.originCountry && <p className="mt-3 text-muted-foreground">{company.originCountry}</p>}
          </div>
        </section>

        {titles.length > 0 && (
          <div className="mt-12">
            <ContentRow
              row={{
                id: `company-discovery-${company.id}`,
                title: `Discover more from ${company.name}`,
                kind: 'landscape',
                titles: titles.slice(0, 14),
                addLogo: true,
                addText: true,
              }}
            />
          </div>
        )}

        <CatalogHydrator titles={titles} />

        {company.movies.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 font-display text-2xl font-bold">Movies</h2>
            <BrowseGrid titles={company.movies} />
          </section>
        )}

        {company.tvShows.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-6 font-display text-2xl font-bold">TV Shows</h2>
            <BrowseGrid titles={company.tvShows} />
          </section>
        )}

        {titles.length === 0 && (
          <section className="mt-16">
            <h2 className="mb-6 font-display text-2xl font-bold md:text-3xl">Titles from {company.name}</h2>
            <BrowseGrid titles={[]} emptyLabel="No movies or TV shows from this company are in the catalog yet." />
          </section>
        )}
      </div>
    </PageShell>
  )
}
