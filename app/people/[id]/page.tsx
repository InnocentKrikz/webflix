import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BrowseGrid } from '@/components/browse-grid'
import { CatalogHydrator } from '@/components/catalog-hydrator'
import { ContentRow } from '@/components/content-row'
import { PageShell } from '@/components/page-shell'
import { PersonCreditList } from '@/components/person-credit-list'
import { getPerson } from '@/lib/data'
import { personMetadata } from '@/lib/site-metadata'
import type { PersonCredit } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id: rawId } = await params
  const person = await getPerson(Number(rawId))
  return person ? personMetadata(person) : {}
}

function formatDate(value?: string) {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en', { dateStyle: 'long', timeZone: 'UTC' }).format(date)
}

function creditsByTitle(credits: PersonCredit[]) {
  const seen = new Set<string>()
  return credits.filter((credit) => {
    if (seen.has(credit.title.id)) return false
    seen.add(credit.title.id)
    return true
  })
}

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params
  const id = Number(rawId)
  const person = await getPerson(id)
  if (!person) notFound()

  const credits = creditsByTitle([...person.movieCredits, ...person.tvCredits])
  const discoveryTitles = credits.slice(0, 14).map((credit) => credit.title)
  const birthday = formatDate(person.birthday)
  const deathday = formatDate(person.deathday)

  return (
    <PageShell>
      <div className="mx-auto max-w-[1600px] px-4 pb-20 pt-28 md:px-12 md:pt-32">
        <Link href="/browse" className="mb-8 inline-flex text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
          ← Back to Browse
        </Link>

        <section className="grid gap-8 md:grid-cols-[220px_1fr] md:items-start">
          <div className="relative mx-auto aspect-[2/3] w-48 overflow-hidden rounded-xl bg-secondary ring-1 ring-white/10 md:mx-0 md:w-full">
            <Image src={person.photo || '/placeholder.svg'} alt={person.name} fill sizes="220px" className="object-cover" />
          </div>
          <div className="max-w-4xl">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary">People</p>
            <h1 className="font-display text-4xl font-extrabold tracking-tight md:text-6xl">{person.name}</h1>
            {person.knownForDepartment && <p className="mt-3 text-muted-foreground">{person.knownForDepartment}</p>}
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {birthday && <span>Born {birthday}</span>}
              {deathday && <span>Died {deathday}</span>}
              {person.placeOfBirth && <span>{person.placeOfBirth}</span>}
            </div>
            {person.biography && (
              <p className="mt-8 max-w-3xl whitespace-pre-line text-pretty text-sm leading-7 text-foreground/85 md:text-base">
                {person.biography}
              </p>
            )}
          </div>
        </section>

        {discoveryTitles.length > 0 && (
          <div className="mt-12">
            <ContentRow
              row={{
                id: `person-discovery-${person.id}`,
                title: `Discover more from ${person.name}`,
                kind: 'landscape',
                titles: discoveryTitles,
                addLogo: true,
                addText: true,
              }}
            />
          </div>
        )}

        <section className="mt-16">
          <CatalogHydrator titles={credits.map((credit) => credit.title)} />
          <h2 className="mb-6 font-display text-2xl font-bold md:text-3xl">Known for</h2>
          <BrowseGrid
            titles={credits.map((credit) => credit.title)}
            emptyLabel="There are no credited titles in the Sceneflix catalog yet."
          />
        </section>

        {person.movieCredits.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-4 font-display text-2xl font-bold">Movie credits</h2>
            <PersonCreditList credits={person.movieCredits} />
          </section>
        )}

        {person.tvCredits.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-4 font-display text-2xl font-bold">TV credits</h2>
            <PersonCreditList credits={person.tvCredits} />
          </section>
        )}
      </div>
    </PageShell>
  )
}
