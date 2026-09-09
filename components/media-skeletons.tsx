import { PageShell } from '@/components/page-shell'

const LANDSCAPE_COUNT = 6
const PORTRAIT_COUNT = 14

function SkeletonBlock({ className }: { className: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded bg-secondary ${className}`} />
}

export function BrowseGridSkeleton() {
  return (
    <div aria-label="Loading titles" className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
      {Array.from({ length: PORTRAIT_COUNT }, (_, index) => (
        <div key={index} className="relative aspect-[2/3] overflow-hidden rounded-md bg-secondary">
          <div className="absolute inset-x-3 bottom-3 space-y-2">
            <SkeletonBlock className="h-3 w-3/4 bg-muted" />
            <SkeletonBlock className="h-2.5 w-1/2 bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ContentRowSkeleton({ title = true }: { title?: boolean } = {}) {
  return (
    <section aria-hidden="true" className="relative overflow-hidden py-3 md:py-2">
      {title && (
        <div className="mb-2 flex items-center gap-3 px-4 md:px-12 md:mb-1 md:px-8">
          <SkeletonBlock className="h-5 w-1 rounded-full bg-primary/50" />
          <SkeletonBlock className="h-6 w-44" />
        </div>
      )}
      <div className="mx-4 flex gap-2.5 overflow-hidden px-3 pb-8 pt-2 md:mx-12 md:gap-3 md:px-3 md:pb-6 md:pt-1">
        {Array.from({ length: LANDSCAPE_COUNT }, (_, index) => (
          <SkeletonBlock key={index} className="aspect-video w-[230px] shrink-0 sm:w-[260px] md:w-[300px] md:max-lg:w-[270px]" />
        ))}
      </div>
    </section>
  )
}

export function ProductionCompanyRowSkeleton() {
  return (
    <section aria-hidden="true" className="relative overflow-hidden py-4 md:py-5">
      <div className="mb-3 flex items-center gap-2 px-4 md:px-12">
        <SkeletonBlock className="h-5 w-1 rounded-full bg-primary/50" />
        <SkeletonBlock className="h-6 w-64" />
      </div>
      <div className="mx-4 flex gap-3 overflow-hidden px-2 pb-3 pt-1 md:mx-12">
        {Array.from({ length: 6 }, (_, index) => (
          <SkeletonBlock key={index} className="h-28 w-36 shrink-0 rounded-lg sm:h-32 sm:w-44" />
        ))}
      </div>
    </section>
  )
}

export function HomePageSkeleton() {
  return (
    <PageShell>
      <section aria-label="Loading homepage" className="h-[82vh] min-h-[560px] w-full animate-pulse bg-secondary" />
      <div className="relative z-10 -mt-16 space-y-2 pb-16 md:-mt-24 md:max-2xl:-mt-28 md:max-2xl:space-y-0">
        {Array.from({ length: 3 }, (_, index) => <ContentRowSkeleton key={`row-${index}`} />)}
        <ProductionCompanyRowSkeleton />
        {Array.from({ length: 4 }, (_, index) => <ContentRowSkeleton key={`tail-${index}`} />)}
      </div>
    </PageShell>
  )
}

export function TitleBrowserSkeleton({ heading }: { heading: string }) {
  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-20 pt-28 md:px-12 md:pt-32">
      <div className="mb-6 h-10 w-40 animate-pulse rounded bg-secondary">
        <span className="sr-only">Loading {heading}</span>
      </div>
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <SkeletonBlock className="h-9 w-28 rounded-full" />
          <SkeletonBlock className="h-9 w-32 rounded-full" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 8 }, (_, index) => <SkeletonBlock key={index} className="h-8 w-20 shrink-0 rounded-full" />)}
        </div>
      </div>
      <BrowseGridSkeleton />
    </div>
  )
}

export function SearchPageSkeleton() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-20 pt-28 md:px-12 md:pt-32">
      <div className="mb-8">
        <SkeletonBlock className="mb-4 h-10 w-32" />
        <SkeletonBlock className="h-12 w-full max-w-xl rounded-full" />
      </div>
      <BrowseGridSkeleton />
    </div>
  )
}
