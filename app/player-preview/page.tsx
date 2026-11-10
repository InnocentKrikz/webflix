import type { Metadata } from 'next'
import { NativePlayerPreview } from '@/components/native-player-preview'

export const metadata: Metadata = {
  title: 'Native Player Preview | Sceneflix',
  robots: { index: false, follow: false },
}

export default function PlayerPreviewPage() {
  return <NativePlayerPreview />
}
