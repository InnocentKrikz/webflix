'use client'

import { createContext, useContext, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useEffects } from '@/components/providers'

const GlowLayerContext = createContext<HTMLDivElement | null>(null)

/** A sibling of the scrollport, so artwork clipping cannot clip its light. */
export function MediaGlowBoundary({ children, className }: { children: ReactNode; className?: string }) {
  const { reducedEffects } = useEffects()
  const [layer, setLayer] = useState<HTMLDivElement | null>(null)

  if (reducedEffects) return <div className={className}>{children}</div>

  return (
    <div className={className}>
      <div ref={setLayer} aria-hidden="true" className="media-row-glow-layer" />
      <GlowLayerContext.Provider value={layer}>{children}</GlowLayerContext.Provider>
    </div>
  )
}

function PortaledGlow({ layer, children }: { layer: HTMLDivElement; children: ReactNode }) {
  const anchorRef = useRef<HTMLSpanElement>(null)
  const glowRef = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const anchor = anchorRef.current
    const glow = glowRef.current
    const card = anchor?.parentElement
    const boundary = layer.parentElement
    if (!anchor || !glow || !card || !boundary) return

    let frame = 0
    const update = () => {
      frame = 0
      const bounds = layer.getBoundingClientRect()
      const rect = anchor.getBoundingClientRect()
      // Only the visible part of a card should emit light at either end of
      // the carousel. Fully offscreen cards must not illuminate the margin.
      const left = Math.max(rect.left, bounds.left)
      const right = Math.min(rect.right, bounds.right)
      const visible = right > left && rect.height > 0
      glow.hidden = !visible
      glow.dataset.active = String(card.matches(':hover, :focus-within'))
      if (!visible) return
      glow.style.left = `${left - bounds.left}px`
      glow.style.top = `${rect.top - bounds.top}px`
      glow.style.width = `${right - left}px`
      glow.style.height = `${rect.height}px`
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    // Framer Motion writes transforms during hover and layout animations.
    // Observe those writes instead of running a perpetual measurement loop.
    const transforms = new MutationObserver(schedule)
    let ancestor: HTMLElement | null = card
    while (ancestor && ancestor !== boundary) {
      transforms.observe(ancestor, { attributes: true, attributeFilter: ['style', 'class'] })
      ancestor = ancestor.parentElement
    }
    const resize = new ResizeObserver(schedule)
    resize.observe(card)
    resize.observe(layer)
    boundary.addEventListener('scroll', schedule, true)
    card.addEventListener('pointerenter', schedule)
    card.addEventListener('pointerleave', schedule)
    card.addEventListener('focusin', schedule)
    card.addEventListener('focusout', schedule)
    update()

    return () => {
      cancelAnimationFrame(frame)
      transforms.disconnect()
      resize.disconnect()
      boundary.removeEventListener('scroll', schedule, true)
      card.removeEventListener('pointerenter', schedule)
      card.removeEventListener('pointerleave', schedule)
      card.removeEventListener('focusin', schedule)
      card.removeEventListener('focusout', schedule)
    }
  }, [layer])

  return (
    <>
      <span ref={anchorRef} aria-hidden="true" className="pointer-events-none absolute inset-0" />
      {createPortal(<span ref={glowRef} className="media-glow-host absolute rounded-md">{children}</span>, layer)}
    </>
  )
}

type MediaCardGlowProps = {
  colors: [string | null | undefined, string | null | undefined, string | null | undefined]
}

const HEX_COLOR = /^#[0-9a-f]{6}$/i
const FALLBACK_COLORS = ['#252525', '#171717', '#0b0b0d'] as const

export function MediaCardGlow({ colors }: MediaCardGlowProps) {
  const { reducedEffects } = useEffects()
  const layer = useContext(GlowLayerContext)
  const validColors = colors.map((color) => (color && HEX_COLOR.test(color) ? color : null))
  if (reducedEffects) return null

  const firstValid = validColors.find((color): color is string => color !== null)
  const primary = validColors[0] ?? firstValid ?? FALLBACK_COLORS[0]
  const secondary = validColors[1] ?? validColors.find((color): color is string => color !== null && color !== primary) ?? FALLBACK_COLORS[1]
  const tertiary = validColors[2] ?? FALLBACK_COLORS[2]

  const glow = (
    <span
      aria-hidden="true"
      className="media-card-glow pointer-events-none absolute -inset-2 z-0 rounded-[inherit] opacity-25 blur-xl transition-[opacity,filter,transform] duration-700 group-hover:scale-[1.04] group-hover:opacity-55 group-hover:blur-[22px] motion-reduce:animate-none"
      style={{
        '--media-card-glow-1': primary,
        '--media-card-glow-2': secondary,
        '--media-card-glow-3': tertiary,
      } as CSSProperties}
    />
  )

  return layer ? <PortaledGlow layer={layer}>{glow}</PortaledGlow> : glow
}
