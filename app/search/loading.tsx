import { PageShell } from '@/components/page-shell'
import { SearchPageSkeleton } from '@/components/media-skeletons'

export default function Loading() {
  return (
    <PageShell>
      <SearchPageSkeleton />
    </PageShell>
  )
}
