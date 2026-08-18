'use client'

import { useRouter } from 'next/navigation'
import { Check, ChevronDown, Play, Plus, ThumbsUp } from 'lucide-react'
import { useModal, useMyList } from '@/components/providers'
import { cn } from '@/lib/utils'
import type { Title } from '@/lib/types'

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

  return (
    <div className="flex items-center gap-1.5">
      <RoundButton label="Play" primary onClick={() => router.push(`/watch/${title.slug}`)}>
        <Play className={cn('fill-background', compact ? 'size-3.5' : 'size-4')} />
      </RoundButton>
      <RoundButton label={inList ? 'Remove from My List' : 'Add to My List'} onClick={() => toggle(title.id)}>
        {inList ? <Check className="size-4 text-primary" /> : <Plus className="size-4" />}
      </RoundButton>
      {!compact && (
        <RoundButton label="Rate" onClick={() => open(title.id)}>
          <ThumbsUp className="size-4" />
        </RoundButton>
      )}
      <RoundButton label="More info" className="ml-auto" onClick={() => open(title.id)}>
        <ChevronDown className="size-4" />
      </RoundButton>
    </div>
  )
}
