'use client'

import { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import type { Title } from '@/lib/types'

const TopTenContext = createContext<ReadonlySet<string> | null>(null)

/** Share the displayed Top 10 row across independently loaded homepage cards. */
export function TopTenProvider({ ids, children }: { ids: string[]; children: ReactNode }) {
  const topTenIds = useMemo(() => new Set(ids), [ids])
  return <TopTenContext.Provider value={topTenIds}>{children}</TopTenContext.Provider>
}

export function useTopTenBadge(title: Title) {
  const topTenIds = useContext(TopTenContext)
  if (topTenIds !== null) return topTenIds.has(title.id)
  return title.badges?.length ? title.badges.includes('Top 10') : title.badge === 'Top 10'
}
