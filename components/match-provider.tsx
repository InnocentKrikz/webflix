'use client'

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from 'react'
import { authClient } from '@/lib/auth-client'
import { EMPTY_MATCH, MatchStore } from '@/lib/match-client'

const MatchContext = createContext<MatchStore | null>(null)

export function MatchProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = authClient.useSession()
  const userId = session?.user.id ?? null
  const store = useMemo(() => new MatchStore(userId), [userId])

  useEffect(() => {
    store.activate()
    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('webflix:matches') : null
    const refresh = () => {
      store.refresh()
      channel?.postMessage('refresh')
    }
    const onFocus = () => store.refresh()
    if (channel) channel.onmessage = () => store.refresh()
    window.addEventListener('webflix:activity', refresh)
    window.addEventListener('focus', onFocus)
    return () => {
      window.removeEventListener('webflix:activity', refresh)
      window.removeEventListener('focus', onFocus)
      channel?.close()
      store.dispose()
    }
  }, [store])

  return <MatchContext.Provider value={store}>{children}</MatchContext.Provider>
}

export function useMatch(id: string) {
  const store = useContext(MatchContext)
  if (!store) throw new Error('useMatch must be used within MatchProvider')
  const entry = useSyncExternalStore(store.subscribe, () => store.get(id), () => EMPTY_MATCH)
  useEffect(() => store.retain(id), [store, id])
  return { ...entry, signedIn: Boolean(store.userId), rate: store.rate, refresh: store.refresh }
}
