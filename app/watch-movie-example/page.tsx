import type { Metadata } from 'next'
import { Suspense } from 'react'
import { WatchMovieExample } from '@/components/watch-movie-example'

export const metadata: Metadata = {
  title: 'Watch movie | Sceneflix',
  robots: { index: false, follow: false },
}

export default function WatchMovieExamplePage() {
  return <Suspense><WatchMovieExample /></Suspense>
}
