import { NextRequest, NextResponse } from 'next/server'
import { getTitles } from '@/lib/data'
import type { MediaType } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const type = params.get('type')
  const genre = params.get('genre') ?? undefined
  const query = params.get('query') ?? undefined
  const sort = params.get('sort') ?? undefined
  const ids = params.get('ids')?.split(',').filter(Boolean)

  const titles = await getTitles({
    ids,
    query,
    genre,
    sort: sort === 'rating' || sort === 'year' || sort === 'az' ? sort : 'trending',
    type: type === 'movie' || type === 'tv' || type === 'all' ? (type as MediaType | 'all') : undefined,
  })

  return NextResponse.json(titles)
}
