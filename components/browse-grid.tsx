'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { SearchX } from 'lucide-react'
import { PortraitCard } from '@/components/media-card'
import type { Title } from '@/lib/types'

export function BrowseGrid({ titles, emptyLabel }: { titles: Title[]; emptyLabel?: string }) {
  if (titles.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-3 py-24 text-center text-muted-foreground"
      >
        <SearchX className="size-10" />
        <p className="text-lg font-semibold text-foreground">No matches found</p>
        <p className="max-w-sm text-sm">{emptyLabel ?? 'Try a different genre, sort order, or search term.'}</p>
      </motion.div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
      <AnimatePresence mode="popLayout">
        {titles.map((t, i) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
          >
            <PortraitCard title={t} className="w-full sm:w-full md:w-full" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
