import { TitleBrowser } from '@/components/title-browser'
import { getGenres, getTitles } from '@/lib/data'
import type { MediaType } from '@/lib/types'

export async function BrowserContent({ heading, fixedType, initialGenre = 'All', emptyLabel }: {
  heading: string; fixedType?: MediaType; initialGenre?: string; emptyLabel: string
}) {
  const [titles, genres] = await Promise.all([
    getTitles({ type: fixedType ?? 'all', genre: initialGenre, sort: 'trending' }),
    getGenres(fixedType ?? 'all'),
  ])
  return <TitleBrowser heading={heading} fixedType={fixedType} initialGenre={initialGenre} emptyLabel={emptyLabel} initialTitles={titles} initialGenres={genres} />
}
