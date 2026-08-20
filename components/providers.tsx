'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { DetailModal } from '@/components/detail-modal'
import type { Title } from '@/lib/types'

/* ----------------------------- My List store ----------------------------- */

interface MyListContextValue {
  ids: string[]
  has: (id: string) => boolean
  toggle: (id: string) => void
}

const MyListContext = createContext<MyListContextValue | null>(null)

const STORAGE_KEY = 'webflix:my-list'

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

export function Providers({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([])
  const [openId, setOpenId] = useState<string | null>(null)
  const [catalog, setCatalog] = useState<Record<string, Title>>({})

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
      for (const title of titles) next[title.id] = title
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
    <MyListContext.Provider value={myList}>
      <CatalogContext.Provider value={catalogValue}>
        <ModalContext.Provider value={modal}>
          {children}
          <DetailModal />
        </ModalContext.Provider>
      </CatalogContext.Provider>
    </MyListContext.Provider>
  )
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
