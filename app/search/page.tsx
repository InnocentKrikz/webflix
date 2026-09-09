import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PageShell } from '@/components/page-shell'
import { SearchContent } from '@/components/search-content'
import { SearchPageSkeleton } from '@/components/media-skeletons'
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

export default function SearchPage() {
  return (
    <PageShell>
      <Suspense fallback={<SearchPageSkeleton />}>
        <SearchContent />
      </Suspense>
    </PageShell>
  )
}
