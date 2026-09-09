'use client'

import { useState } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Check, LoaderCircle, ThumbsDown, ThumbsUp } from 'lucide-react'
import { useMatch } from '@/components/match-provider'
import type { FeedbackValue } from '@/lib/match-client'
import { cn } from '@/lib/utils'

export function RatingButton({ id, large = false }: { id: string; large?: boolean }) {
  const [open, setOpen] = useState(false)
  const { match, saving, error, rate } = useMatch(id)
  const value = match?.feedback ?? null
  const Icon = saving ? LoaderCircle : value === 'DISLIKE' ? ThumbsDown : ThumbsUp

  async function select(next: FeedbackValue | null) {
    if (await rate(id, next)) {
      setOpen(false)
      // Refresh other mounted clients/tabs after a successful write.
      window.dispatchEvent(new Event('sceneflix:activity'))
    }
  }

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          disabled={saving}
          aria-label={value === 'LIKE' ? 'Liked — change rating' : value === 'DISLIKE' ? 'Disliked — change rating' : 'Rate this title'}
          className={cn(
            'grid shrink-0 place-items-center rounded-full border border-white/40 bg-black/40 text-foreground backdrop-blur transition-colors hover:border-white disabled:opacity-60',
            large ? 'size-10 sm:size-11' : 'size-8', value && 'border-emerald-400 text-emerald-400',
          )}
        >
          <Icon className={cn(large ? 'size-4 sm:size-5' : 'size-4', saving && 'animate-spin')} />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={8}
          className="z-[120] min-w-48 max-w-64 rounded-lg border border-white/15 bg-card p-1.5 text-sm shadow-xl"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          {(['LIKE', 'DISLIKE'] as const).map((option) => {
            const OptionIcon = option === 'LIKE' ? ThumbsUp : ThumbsDown
            return (
              <DropdownMenu.Item
                key={option}
                disabled={saving}
                onSelect={(event) => { event.preventDefault(); void select(option) }}
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 outline-none data-[highlighted]:bg-white/10 data-[disabled]:opacity-50"
              >
                <OptionIcon className="size-4" /> {option === 'LIKE' ? 'I like this' : 'Not for me'}
                {value === option && <Check className="ml-auto size-4 text-emerald-400" />}
              </DropdownMenu.Item>
            )
          })}
          {value && (
            <DropdownMenu.Item
              disabled={saving}
              onSelect={(event) => { event.preventDefault(); void select(null) }}
              className="cursor-pointer rounded-md px-3 py-2 text-muted-foreground outline-none data-[highlighted]:bg-white/10"
            >
              Remove rating
            </DropdownMenu.Item>
          )}
          {error && <p role="alert" className="px-3 py-2 text-xs text-red-400">{error}</p>}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
