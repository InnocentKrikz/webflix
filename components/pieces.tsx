import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Title } from '@/lib/types'

export function RatingStar({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <Star className="size-3.5 fill-primary text-primary" />
      <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
    </span>
  )
}

export function Dot() {
  return <span className="text-muted-foreground/60">&middot;</span>
}

export function MaturityBadge({ value, className }: { value: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded border border-white/20 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-foreground/90',
        className,
      )}
    >
      {value}
    </span>
  )
}

export function QualityBadge({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground/80">
      {value}
    </span>
  )
}

/** Compact maturity pill used inside hover-preview cards. */
export function MaturityTag({ maturity }: { maturity: string }) {
  return (
    <span className="inline-flex items-center rounded border border-white/25 px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
      {maturity}
    </span>
  )
}

/** Compact quality pill used inside hover-preview cards. */
export function QualityTag({ quality }: { quality: string }) {
  return (
    <span className="inline-flex items-center rounded bg-white/10 px-1 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground/80">
      {quality}
    </span>
  )
}

export function TypeTag({ type }: { type: Title['type'] }) {
  return (
    <span className="inline-flex items-center rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground/80 backdrop-blur">
      {type === 'tv' ? 'Series' : 'Movie'}
    </span>
  )
}

export function MetaLine({ title, className }: { title: Title; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground', className)}>
      <RatingStar rating={title.rating} />
      <Dot />
      <span>{title.year}</span>
      <Dot />
      <span>{title.type === 'tv' ? `${title.seasons?.length ?? 1} Season${(title.seasons?.length ?? 1) > 1 ? 's' : ''}` : title.runtime}</span>
      <Dot />
      <span>{title.genres[0]}</span>
    </div>
  )
}
