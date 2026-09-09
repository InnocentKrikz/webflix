import type { Metadata } from 'next'
import { sectionMetadata } from '@/lib/site-metadata'

export const metadata: Metadata = sectionMetadata(
  'My List',
  'Keep your favorite movies and TV shows together in your Sceneflix watchlist.',
)

export default function MyListLayout({ children }: { children: React.ReactNode }) {
  return children
}
