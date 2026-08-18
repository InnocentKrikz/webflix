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

/* ----------------------------- My List store ----------------------------- */

interface MyListContextValue {
  ids: string[]
  has: (id: string) => boolean
  toggle: (id: string) => void
}

const MyListContext = createContext<MyListContextValue | null>(null)

const STORAGE_KEY = 'webflix:my-list'

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
      <ModalContext.Provider value={modal}>
        {children}
        <DetailModal />
      </ModalContext.Provider>
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
