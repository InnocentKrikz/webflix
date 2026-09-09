'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { MotionConfig } from 'framer-motion'
import { DetailModal } from '@/components/detail-modal'
import { MatchProvider } from '@/components/match-provider'
import { authClient } from '@/lib/auth-client'
import { withFallbackDominantColors } from '@/lib/title-colors'
import { syncViewerIdentity } from '@/lib/viewer-client'
import type { Title } from '@/lib/types'

/* -------------------------- Effects preference -------------------------- */

interface EffectsContextValue {
  reducedEffects: boolean
  setReducedEffects: (enabled: boolean) => void
}

const EffectsContext = createContext<EffectsContextValue | null>(null)

const EFFECTS_STORAGE_KEY = 'sceneflix:reduce-effects'

/* ----------------------------- My List store ----------------------------- */

interface MyListContextValue {
  ids: string[]
  has: (id: string) => boolean
  toggle: (id: string) => void
}

const MyListContext = createContext<MyListContextValue | null>(null)

const STORAGE_KEY = 'sceneflix:my-list'

/* ----------------------------- Catalog store ----------------------------- */

interface CatalogContextValue {
  titles: Title[]
  getTitle: (id: string) => Title | undefined
  registerTitles: (titles: Title[]) => void
}

const CatalogContext = createContext<CatalogContextValue | null>(null)

/* ------------------------------ Modal store ------------------------------ */

interface ModalContextValue {
  openId: string | null
  open: (id: string) => void
  close: () => void
}

const ModalContext = createContext<ModalContextValue | null>(null)

function IdentityBootstrap() {
  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    if (isPending) return
    void syncViewerIdentity()
      .then(() => {
        window.dispatchEvent(new Event('sceneflix:identity-merged'))
        window.dispatchEvent(new Event('sceneflix:activity'))
      })
      .catch(() => undefined)
  }, [isPending, session?.user.id])

  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([])
  const [openId, setOpenId] = useState<string | null>(null)
  const [catalog, setCatalog] = useState<Record<string, Title>>({})
  const [reducedEffects, setReducedEffectsState] = useState(false)

  useEffect(() => {
    try {
      setReducedEffectsState(localStorage.getItem(EFFECTS_STORAGE_KEY) === 'true')
    } catch {
      /* ignore */
    }
  }, [])

  const setReducedEffects = useCallback((enabled: boolean) => {
    setReducedEffectsState(enabled)
    document.documentElement.toggleAttribute('data-reduce-effects', enabled)

    try {
      localStorage.setItem(EFFECTS_STORAGE_KEY, String(enabled))
    } catch {
      /* ignore */
    }
  }, [])

  const effects = useMemo<EffectsContextValue>(
    () => ({ reducedEffects, setReducedEffects }),
    [reducedEffects, setReducedEffects],
  )

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setIds(JSON.parse(raw))
    } catch {
      /* ignore */
    }
  }, [])

  const persist = useCallback((next: string[]) => {
    setIds(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }, [])

  const toggle = useCallback(
    (id: string) => {
      persist(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id])
    },
    [ids, persist],
  )

  const has = useCallback((id: string) => ids.includes(id), [ids])

  const myList = useMemo<MyListContextValue>(() => ({ ids, has, toggle }), [ids, has, toggle])

  const registerTitles = useCallback((titles: Title[]) => {
    if (titles.length === 0) return
    setCatalog((current) => {
      const next = { ...current }
      for (const title of titles) {
        next[title.id] = withFallbackDominantColors(title, current[title.id])
      }
      return next
    })
  }, [])

  const getTitle = useCallback((id: string) => catalog[id], [catalog])

  const catalogValue = useMemo<CatalogContextValue>(
    () => ({
      titles: Object.values(catalog),
      getTitle,
      registerTitles,
    }),
    [catalog, getTitle, registerTitles],
  )

  const modal = useMemo<ModalContextValue>(
    () => ({
      openId,
      open: (id: string) => setOpenId(id),
      close: () => setOpenId(null),
    }),
    [openId],
  )

  return (
    <EffectsContext.Provider value={effects}>
      <IdentityBootstrap />
      <MotionConfig
        reducedMotion={reducedEffects ? 'always' : 'user'}
        skipAnimations={reducedEffects}
      >
        <MyListContext.Provider value={myList}>
          <CatalogContext.Provider value={catalogValue}>
            <ModalContext.Provider value={modal}>
              <MatchProvider>
                {children}
                <DetailModal />
              </MatchProvider>
            </ModalContext.Provider>
          </CatalogContext.Provider>
        </MyListContext.Provider>
      </MotionConfig>
    </EffectsContext.Provider>
  )
}

export function useEffects() {
  const ctx = useContext(EffectsContext)
  if (!ctx) throw new Error('useEffects must be used within Providers')
  return ctx
}

export function useMyList() {
  const ctx = useContext(MyListContext)
  if (!ctx) throw new Error('useMyList must be used within Providers')
  return ctx
}

export function useModal() {
  const ctx = useContext(ModalContext)
  if (!ctx) throw new Error('useModal must be used within Providers')
  return ctx
}

export function useCatalog() {
  const ctx = useContext(CatalogContext)
  if (!ctx) throw new Error('useCatalog must be used within Providers')
  return ctx
}
