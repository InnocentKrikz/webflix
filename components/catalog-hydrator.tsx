'use client'

import { useEffect } from 'react'
import { useCatalog } from '@/components/providers'
import type { Title } from '@/lib/types'

export function CatalogHydrator({ titles }: { titles: Title[] }) {
  const { registerTitles } = useCatalog()

  useEffect(() => {
    registerTitles(titles)
  }, [registerTitles, titles])

  return null
}
