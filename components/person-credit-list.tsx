'use client'

import { useModal } from '@/components/providers'
import type { PersonCredit } from '@/lib/types'

export function PersonCreditList({ credits }: { credits: PersonCredit[] }) {
  const { open } = useModal()

  return (
    <div className="grid gap-x-6 gap-y-3 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
      {credits.slice(0, 18).map((credit) => (
        <button
          key={credit.title.id}
          type="button"
          onClick={() => open(credit.title.id)}
          className="flex justify-between gap-4 rounded-md border border-white/10 px-4 py-3 text-left transition-colors hover:border-primary/50 hover:text-foreground"
        >
          <span className="truncate text-foreground">{credit.title.title}</span>
          <span className="shrink-0">{credit.character || 'Cast'}</span>
        </button>
      ))}
    </div>
  )
}
