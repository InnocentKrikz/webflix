'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Bookmark } from 'lucide-react'
import { PageShell } from '@/components/page-shell'
import { BrowseGrid } from '@/components/browse-grid'
import { useMyList } from '@/components/providers'
import { TITLES } from '@/lib/data'

export default function MyListPage() {
  const { ids } = useMyList()

  const titles = useMemo(
    () => TITLES.filter((t) => ids.includes(t.id)),
    [ids],
  )

  return (
    <PageShell>
      <div className="mx-auto max-w-[1600px] px-4 pb-20 pt-28 md:px-12 md:pt-32">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 flex items-center gap-3"
        >
          <span className="grid size-9 place-items-center rounded-full bg-primary/15 text-primary">
            <Bookmark className="size-5" />
          </span>
          <h1 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">My List</h1>
        </motion.div>

        <BrowseGrid
          titles={titles}
          emptyLabel="Titles you save will show up here. Tap the + on any movie or show to add it to My List."
        />
      </div>
    </PageShell>
  )
}
