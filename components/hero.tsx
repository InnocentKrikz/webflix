'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Info, Play, Plus, Check, Volume2, VolumeX } from 'lucide-react'
import { useModal, useMyList } from '@/components/providers'
import { Dot, MaturityBadge, RatingStar } from '@/components/pieces'
import type { Title } from '@/lib/types'

export function Hero({ titles }: { titles: Title[] }) {
  const [index, setIndex] = useState(0)
  const [muted, setMuted] = useState(true)
  const router = useRouter()
  const { open } = useModal()
  const { has, toggle } = useMyList()

  const next = useCallback(() => setIndex((i) => (i + 1) % titles.length), [titles.length])

  useEffect(() => {
    const t = setInterval(next, 8000)
    return () => clearInterval(t)
  }, [next])

  const title = titles[index]
  const inList = has(title.id)

  return (
    <section className="relative h-[82vh] min-h-[560px] w-full overflow-hidden">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={title.id}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 1.1, ease: 'easeInOut' }}
        >
          <Image
            src={title.backdrop || '/placeholder.svg'}
            alt={title.title}
            fill
            priority
            sizes="100vw"
            className="object-cover object-top"
          />
        </motion.div>
      </AnimatePresence>

      {/* gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />

      {/* content */}
      <div className="relative z-10 mx-auto flex h-full max-w-[1600px] flex-col justify-end px-4 pb-24 md:px-8 md:pb-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={title.id}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="max-w-2xl"
          >
            <div className="mb-4 flex items-center gap-2">
              <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                Webflix
              </span>
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {title.type === 'tv' ? 'Series' : 'Film'}
              </span>
            </div>

            <h1 className="font-display text-4xl font-extrabold leading-[0.95] tracking-tight text-balance text-glow md:text-7xl">
              {title.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm md:text-base">
              <RatingStar rating={title.rating} />
              <Dot />
              <span>{title.year}</span>
              <Dot />
              <MaturityBadge value={title.maturity} />
              <Dot />
              {title.genres.slice(0, 3).map((g, i) => (
                <span key={g} className="flex items-center gap-3">
                  {i > 0 && <Dot />}
                  <span className="text-muted-foreground">{g}</span>
                </span>
              ))}
            </div>

            <p className="mt-4 max-w-xl text-pretty text-sm leading-relaxed text-foreground/85 md:text-base line-clamp-3">
              {title.description}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                onClick={() => router.push(`/watch/${title.slug}`)}
                className="group inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3 font-semibold text-background transition-transform hover:scale-[1.03] active:scale-95"
              >
                <Play className="size-5 fill-background" />
                Play
              </button>
              <button
                onClick={() => open(title.id)}
                className="inline-flex items-center gap-2 rounded-full bg-white/15 px-6 py-3 font-semibold text-foreground backdrop-blur transition-colors hover:bg-white/25"
              >
                <Info className="size-5" />
                More Info
              </button>
              <button
                onClick={() => toggle(title.id)}
                aria-label={inList ? 'Remove from My List' : 'Add to My List'}
                className="grid size-12 place-items-center rounded-full border border-white/25 bg-black/30 text-foreground backdrop-blur transition-colors hover:border-white/60"
              >
                {inList ? <Check className="size-5 text-primary" /> : <Plus className="size-5" />}
              </button>
            </div>
          </motion.div>
          
        </AnimatePresence>
          {/* dots */}
      <motion.div className=" bottom-10 left-4 z-10 flex items-center gap-2 md:left-8 mt-5"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      >
        {titles.map((t, i) => (
          <button
            key={t.id}
            onClick={() => setIndex(i)}
            aria-label={`Go to ${t.title}`}
            className="group h-1.5 overflow-hidden rounded-full bg-white/25 transition-all"
            style={{ width: i === index ? 34 : 14 }}
          >
            {i === index && (
              <motion.span
                key={index}
                className="block h-full rounded-full bg-primary"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 8, ease: 'linear' }}
              />
            )}
          </button>
        ))}
      </motion.div>
      </div>

      {/* right controls: mute + maturity */}
      <div className="absolute bottom-24 right-4 z-10 flex items-center gap-3 md:bottom-28 md:right-8">
        <button
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? 'Unmute' : 'Mute'}
          className="grid size-10 place-items-center rounded-full border border-white/30 text-foreground/90 transition-colors hover:border-white/70"
        >
          {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </button>
        <div className="border-l-2 border-primary bg-black/40 py-1 pl-3 pr-6 text-sm font-medium backdrop-blur">
          {title.maturity}
        </div>
      </div>

    
    </section>
  )
}
