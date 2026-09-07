import { LoaderCircle } from 'lucide-react'

export function PageLoading({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex min-h-[22rem] flex-col items-center justify-center gap-3 text-muted-foreground">
      <LoaderCircle className="size-9 animate-spin text-primary" aria-hidden="true" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  )
}
