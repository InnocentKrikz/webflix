'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { useEffects } from '@/components/providers'
import { trailerSampleIndexAt } from '@/lib/trailer-timeline'
import { cn } from '@/lib/utils'
import type { TrailerColorSample } from '@/lib/types'

export function useTrailerAmbient(timeline: readonly TrailerColorSample[] | undefined) {
  const [sampleIndex, setSampleIndex] = useState(timeline?.length ? 0 : -1)
  const sampleIndexRef = useRef(sampleIndex)

  useEffect(() => {
    const nextIndex = timeline?.length ? 0 : -1
    sampleIndexRef.current = nextIndex
    setSampleIndex(nextIndex)
  }, [timeline])

  const onTimeUpdate = useCallback((currentTime: number) => {
    if (!timeline?.length || !Number.isFinite(currentTime)) return
    const nextIndex = trailerSampleIndexAt(timeline, currentTime, sampleIndexRef.current)
    if (nextIndex === sampleIndexRef.current) return
    sampleIndexRef.current = nextIndex
    setSampleIndex(nextIndex)
  }, [timeline])

  return {
    onTimeUpdate,
    sample: timeline?.[sampleIndex] ?? timeline?.[0] ?? null,
  }
}

export function TrailerAmbientGlow({
  sample,
  visible,
  className,
}: {
  sample: TrailerColorSample | null
  visible: boolean
  className?: string
}) {
  const { reducedEffects } = useEffects()
  if (!sample || reducedEffects) return null

  const style = {
    '--trailer-average': sample.average,
    '--trailer-left': sample.left,
    '--trailer-center': sample.center,
    '--trailer-right': sample.right,
    '--trailer-top': sample.top,
    '--trailer-bottom': sample.bottom,
  } as CSSProperties

  return (
    <div
      aria-hidden="true"
      data-visible={visible}
      className={cn('trailer-ambient-glow', className)}
      style={style}
    >
      <span className="trailer-ambient-light trailer-ambient-average" />
      <span className="trailer-ambient-light trailer-ambient-left" />
      <span className="trailer-ambient-light trailer-ambient-center" />
      <span className="trailer-ambient-light trailer-ambient-right" />
      <span className="trailer-ambient-light trailer-ambient-top" />
      <span className="trailer-ambient-light trailer-ambient-bottom" />
    </div>
  )
}
