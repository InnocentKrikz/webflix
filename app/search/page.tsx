import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PageShell } from '@/components/page-shell'
import { SearchContent } from '@/components/search-content'
import { SearchPageSkeleton } from '@/components/media-skeletons'
import { getTitles } from '@/lib/data'
import { searchMetadata } from '@/lib/site-metadata'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>
}): Promise<Metadata> {
  const { q } = await searchParams
  return searchMetadata(Array.isArray(q) ? q[0] : q)
}

async function InitialSearch({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams
  const titles = q.trim().length >= 2 && q.length <= 120 ? await getTitles({ query: q }) : []
  return <SearchContent initialServerQuery={q} initialTitles={titles} />
}

export default function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  return (
    <PageShell>
      <Suspense fallback={<SearchPageSkeleton />}>
        <InitialSearch searchParams={searchParams} />
      </Suspense>
    </PageShell>
  )
}
