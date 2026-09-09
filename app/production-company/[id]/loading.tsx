import { BrowseGridSkeleton, ContentRowSkeleton } from '@/components/media-skeletons'
import { PageShell } from '@/components/page-shell'

export default function Loading() {
  return (
    <PageShell>
      <div className="mx-auto max-w-[1600px] px-4 pb-20 pt-28 md:px-12 md:pt-32">
        <div className="mb-8 h-5 w-28 animate-pulse rounded bg-secondary" />
        <section className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="size-32 animate-pulse rounded-2xl bg-secondary sm:size-40" />
          <div className="space-y-4">
            <div className="h-4 w-40 animate-pulse rounded bg-secondary" />
            <div className="h-12 w-72 animate-pulse rounded bg-secondary" />
          </div>
        </section>
        <div className="mt-12"><ContentRowSkeleton /></div>
        <section className="mt-16">
          <div className="mb-6 h-8 w-32 animate-pulse rounded bg-secondary" />
          <BrowseGridSkeleton />
        </section>
      </div>
    </PageShell>
  )
}
