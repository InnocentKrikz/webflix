import { PageShell } from '@/components/page-shell'
import { TitleBrowserSkeleton } from '@/components/title-browser-skeleton'

export default function Loading() {
  return (
    <PageShell>
      <TitleBrowserSkeleton heading="TV Shows" />
    </PageShell>
  )
}
