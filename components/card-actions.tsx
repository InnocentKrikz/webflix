'use client'

import { useRouter } from 'next/navigation'
import { Check, ChevronDown, Play, Plus } from 'lucide-react'
import { RatingButton } from '@/components/rating-button'
import { useModal, useMyList } from '@/components/providers'
import { cn } from '@/lib/utils'
import type { Title } from '@/lib/types'
import { isTitleReleased } from '@/lib/availability'

function RoundButton({
  children,
  onClick,
  label,
  primary,
  className,
}: {
  children: React.ReactNode
  onClick?: (e: React.MouseEvent) => void
  label: string
  primary?: boolean
  className?: string
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick?.(e)
      }}
      aria-label={label}
      className={cn(
        'grid size-8 place-items-center rounded-full border transition-all duration-200 hover:scale-110 active:scale-95',
        primary
          ? 'border-transparent bg-foreground text-background'
          : 'border-white/40 bg-black/40 text-foreground backdrop-blur hover:border-white',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function CardActions({ title, compact }: { title: Title; compact?: boolean }) {
  const router = useRouter()
  const { open } = useModal()
  const { has, toggle } = useMyList()
  const inList = has(title.id)
  const released = isTitleReleased(title)
  const progress = title.watchProgress
  const watchHref = progress && title.type === 'tv' && progress.seasonNumber && progress.episodeNumber
    ? `/watch/${title.slug}?s=${progress.seasonNumber}&e=${progress.episodeNumber}`
    : `/watch/${title.slug}`

  return (
    <div className="flex items-center gap-1.5 px-1 pb-1">
      {released ? <RoundButton label="Play" primary onClick={() => router.push(watchHref)}>
        <Play className={cn('fill-background', compact ? 'size-3.5' : 'size-4')} />
      </RoundButton> : <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-semibold">Coming Soon</span>}
      <RoundButton label={inList ? 'Remove from My List' : 'Add to My List'} onClick={() => toggle(title.id)}>
        {inList ? <Check className="size-4 text-primary" /> : <Plus className="size-4" />}
      </RoundButton>
      {released && <RatingButton id={title.id} />}
      <RoundButton label="More info" className="ml-auto mr-1" onClick={() => open(title.id)}>
        <ChevronDown className="size-4" />
      </RoundButton>
    </div>
  )
}
