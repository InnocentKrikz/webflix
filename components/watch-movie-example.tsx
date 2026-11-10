'use client'

import { useSearchParams } from 'next/navigation'
import { NativePlayerPreview } from '@/components/native-player-preview'

export function WatchMovieExample() {
  const movieId = useSearchParams().get('id')?.trim() ?? ''
  return <NativePlayerPreview movieId={/^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/.test(movieId) ? movieId : undefined} />
}
