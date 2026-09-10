'use client'

import { useEffect, useRef } from 'react'
import { prefetchTitle } from './catalog-client'

/** Intent only: no viewport-wide detail prefetch, and no request for a passing pointer. */
export function useTitlePrefetch(id: string) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const cancel = () => clearTimeout(timer.current)
  useEffect(() => cancel, [id])
  return {
    onPointerEnter: () => { cancel(); timer.current = setTimeout(() => prefetchTitle(id), 150) },
    onPointerLeave: cancel,
    onFocus: () => prefetchTitle(id),
  }
}
