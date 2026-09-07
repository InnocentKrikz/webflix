import { PageLoading } from '@/components/page-loading'
import { PageShell } from '@/components/page-shell'

export default function Loading() {
  return (
    <PageShell>
      <div className="px-4 pt-24 md:px-12 md:pt-28">
        <PageLoading label="Loading Browse" />
      </div>
    </PageShell>
  )
}
