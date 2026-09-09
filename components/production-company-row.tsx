'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useEffects } from '@/components/providers'
import type { ProductionCompanySummary } from '@/lib/types'
import { motion } from 'framer-motion'

export function ProductionCompanyRow({ companies }: { companies: ProductionCompanySummary[] }) {
  const scroller = useRef<HTMLDivElement>(null)
  const { reducedEffects } = useEffects()
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = useCallback(() => {
    const element = scroller.current
    if (!element) return
    const maxScrollLeft = Math.max(0, element.scrollWidth - element.clientWidth)
    setCanScrollLeft(element.scrollLeft > 1)
    setCanScrollRight(element.scrollLeft < maxScrollLeft - 1)
  }, [])

  useEffect(() => {
    updateScrollState()
    const element = scroller.current
    if (!element) return
    const observer = new ResizeObserver(updateScrollState)
    observer.observe(element)
    return () => observer.disconnect()
  }, [companies.length, updateScrollState])

  if (companies.length === 0) return null

  return (
    <section className="group/company-row relative overflow-y-auto py-4 md:py-5">
      <div className="mb-3 flex items-center gap-2 px-4 md:px-12">
        <span className="h-5 w-1 rounded-full bg-primary" />
        <h2 className="font-heading text-lg font-bold md:text-xl">Explore production companies</h2>
      </div>
      <div className="no-scrollbar relative mx-4 overflow-x-hidden overflow-y-auto md:mx-12">
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroller.current?.scrollBy({
              left: -scroller.current.clientWidth * 0.8,
              behavior: reducedEffects ? 'auto' : 'smooth',
            })}
            aria-label="Scroll production companies left"
            className="absolute left-0 top-0 z-10 hidden h-full w-12 items-center justify-center bg-gradient-to-r from-background to-transparent md:flex"
          >
            <ChevronLeft className="size-7" />
          </button>
        )}
        <div
          ref={scroller}
          onScroll={updateScrollState}
          className="no-scrollbar flex snap-x gap-3 overflow-x-auto px-2 pb-3 pt-1 scroll-smooth"
        >
          {companies.map((company) => (
            <Link
              key={company.id}
              href={`/production-company/${company.id}`}
              className="group/company relative flex w-36 shrink-0 snap-start flex-col overflow-hidden rounded-lg border border-white/10 bg-card/70 transition-colors hover:border-primary/60 sm:w-44"
            >
              <div className="relative flex h-20 items-center justify-center bg-white p-4 sm:h-24">
                {company.logo ? (
                  <Image src={company.logo} alt={company.name} fill sizes="176px" className="object-contain p-4" />
                ) : (
                  <span className="text-center text-[10px] font-bold uppercase text-black/60">Production Company</span>
                )}
              </div>
              <motion.div className="max-h-0 overflow-hidden opacity-0 transition-all duration-300 group-hover/company:w-full group-hover/company:h-full group-hover/company:max-h-full group-hover/company:opacity-100 p-3 absolute backdrop-blur bottom-0 left-0">
                <p className="line-clamp-2 text-xs font-semibold text-foreground transition-colors group-hover/company:text-primary sm:text-sm">
                  {company.name}
                </p>
                <p className="mt-1 text-[10px] text-black/60 sm:text-xs">
                  {company.titleCount} logged title{company.titleCount === 1 ? '' : 's'}
                </p>
              </motion.div>
            </Link>
          ))}
        </div>
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scroller.current?.scrollBy({
              left: scroller.current.clientWidth * 0.8,
              behavior: reducedEffects ? 'auto' : 'smooth',
            })}
            aria-label="Scroll production companies right"
            className="absolute right-0 top-0 hidden h-full w-12 items-center justify-center bg-gradient-to-l from-background to-transparent md:flex"
          >
            <ChevronRight className="size-7" />
          </button>
        )}
      </div>
    </section>
  )
}
