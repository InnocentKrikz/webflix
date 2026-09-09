import { ContentRowSkeleton, BrowseGridSkeleton } from '@/components/media-skeletons'
import { PageShell } from '@/components/page-shell'

export default function Loading() {
  return (
    <PageShell>
      <div className="mx-auto max-w-[1600px] px-4 pb-20 pt-28 md:px-12 md:pt-32">
        <div className="mb-8 h-5 w-28 animate-pulse rounded bg-secondary" />
        <section className="grid gap-8 md:grid-cols-[220px_1fr] md:items-start">
          <div className="mx-auto aspect-[2/3] w-48 animate-pulse rounded-xl bg-secondary md:mx-0 md:w-full" />
          <div className="space-y-4">
            <div className="h-4 w-24 animate-pulse rounded bg-secondary" />
            <div className="h-12 w-2/3 animate-pulse rounded bg-secondary" />
            <div className="h-24 w-full max-w-3xl animate-pulse rounded bg-secondary" />
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
