import { PageShell } from '@/components/page-shell'
import { TitleBrowserSkeleton } from '@/components/media-skeletons'

export default function Loading() {
  return (
    <PageShell>
      <TitleBrowserSkeleton heading="Browse" />
    </PageShell>
  )
}
