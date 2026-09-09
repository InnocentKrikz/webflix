import { BrowseGridSkeleton } from '@/components/media-skeletons'
import { PageShell } from '@/components/page-shell'

export default function Loading() {
  return (
    <PageShell>
      <div className="mx-auto max-w-[1600px] px-4 pb-20 pt-28 md:px-12 md:pt-32">
        <div className="mb-6 h-10 w-40 animate-pulse rounded bg-secondary" aria-label="Loading your list" />
        <BrowseGridSkeleton />
      </div>
    </PageShell>
  )
}
