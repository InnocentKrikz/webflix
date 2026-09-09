import { notFound } from 'next/navigation'
import { PageShell } from '@/components/page-shell'
import { TitlePageView } from '@/components/title-page-view'
import { getBySlug } from '@/lib/data'

export const dynamic = 'force-dynamic'

export default async function TitlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const title = await getBySlug(slug)
  if (!title) notFound()

  return (
    <PageShell>
      <TitlePageView initialTitle={title} />
    </PageShell>
  )
}
