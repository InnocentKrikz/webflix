'use client'

import * as Select from '@radix-ui/react-select'
import { motion } from 'framer-motion'
import { ArrowDownWideNarrow, Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SortOption = 'trending' | 'rating' | 'year' | 'az'

const SORTS: { value: SortOption; label: string }[] = [
  { value: 'trending', label: 'Trending' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'year', label: 'Newest' },
  { value: 'az', label: 'A–Z' },
]

export function GenreChips({
  genres,
  active,
  onChange,
}: {
  genres: string[]
  active: string
  onChange: (genre: string) => void
}) {
  const all = ['All', ...genres]
  return (
    <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
      {all.map((g) => {
        const isActive = g === active
        return (
          <button
            key={g}
            onClick={() => onChange(g)}
            className={cn(
              'relative shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors',
              isActive ? 'text-background' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {isActive && (
              <motion.span
                layoutId="genre-pill"
                className="absolute inset-0 -z-10 rounded-full bg-foreground"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            {g}
          </button>
        )
      })}
    </div>
  )
}

export function SortSelect({ value, onChange }: { value: SortOption; onChange: (v: SortOption) => void }) {
  return (
    <Select.Root value={value} onValueChange={(v) => onChange(v as SortOption)}>
      <Select.Trigger className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/15 bg-secondary px-4 py-2 text-sm font-medium outline-none transition-colors hover:border-white/30">
        <ArrowDownWideNarrow className="size-4 text-muted-foreground" />
        <Select.Value />
        <Select.Icon>
          <ChevronDown className="size-4" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="z-[60] overflow-hidden rounded-md border border-white/10 bg-popover shadow-2xl">
          <Select.Viewport className="p-1">
            {SORTS.map((s) => (
              <Select.Item
                key={s.value}
                value={s.value}
                className="flex cursor-pointer items-center justify-between gap-4 rounded px-3 py-2 text-sm outline-none data-[highlighted]:bg-white/10"
              >
                <Select.ItemText>{s.label}</Select.ItemText>
                <Select.ItemIndicator>
                  <Check className="size-4 text-primary" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}

export function TypeToggle({
  value,
  onChange,
}: {
  value: 'all' | 'movie' | 'tv'
  onChange: (v: 'all' | 'movie' | 'tv') => void
}) {
  const options: { value: 'all' | 'movie' | 'tv'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'movie', label: 'Movies' },
    { value: 'tv', label: 'TV Shows' },
  ]
  return (
    <div className="relative flex shrink-0 items-center rounded-full bg-secondary p-1 text-sm font-semibold">
      {options.map((opt) => (
        <button key={opt.value} onClick={() => onChange(opt.value)} className="relative z-10 rounded-full px-4 py-1.5">
          {value === opt.value && (
            <motion.span
              layoutId="type-toggle"
              className="absolute inset-0 -z-10 rounded-full bg-primary"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className={cn(value === opt.value ? 'text-primary-foreground' : 'text-muted-foreground')}>{opt.label}</span>
        </button>
      ))}
    </div>
  )
}
