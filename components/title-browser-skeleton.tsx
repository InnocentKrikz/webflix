const SKELETON_COUNT = 14

export function BrowseGridSkeleton() {
  return (
    <div
      aria-label="Loading titles"
      className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7"
    >
      {Array.from({ length: SKELETON_COUNT }, (_, index) => (
        <div
          key={index}
          className="relative aspect-[2/3] overflow-hidden rounded-md bg-secondary animate-pulse"
        >
          <div className="absolute inset-x-3 bottom-3 space-y-2">
            <div className="h-3 w-3/4 rounded bg-muted" />
            <div className="h-2.5 w-1/2 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
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
          <div className="h-9 w-28 animate-pulse rounded-full bg-secondary" />
          <div className="h-9 w-32 animate-pulse rounded-full bg-secondary" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="h-8 w-20 shrink-0 animate-pulse rounded-full bg-secondary" />
          ))}
        </div>
      </div>

      <BrowseGridSkeleton />
    </div>
  )
}
