import type { Metadata } from 'next'
import { sectionMetadata } from '@/lib/site-metadata'

export const metadata: Metadata = sectionMetadata(
  'Sign in',
  'Sign in or create your Sceneflix account to save titles and track your viewing activity.',
)

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children
}
