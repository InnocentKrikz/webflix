import { NextRequest, NextResponse } from 'next/server'
import { getTitles } from '@/lib/data'
import type { MediaType } from '@/lib/types'

export const revalidate = 60

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const type = params.get('type')
  const genre = params.get('genre') ?? undefined
  const query = params.get('query') ?? undefined
  const sort = params.get('sort') ?? undefined
  const ids = params.get('ids')?.split(',').filter(Boolean)

  if (query && (query.trim().length < 2 || query.length > 120)) return NextResponse.json([], { status: 400 })
  if (ids && ids.length > 42) return NextResponse.json({ error: 'At most 42 titles per request' }, { status: 400 })
  const titles = await getTitles({
    ids,
    signal: query ? request.signal : undefined,
    query,
    genre,
    sort: sort === 'rating' || sort === 'year' || sort === 'az' ? sort : 'trending',
    type: type === 'movie' || type === 'tv' || type === 'all' ? (type as MediaType | 'all') : undefined,
  })

  return NextResponse.json(titles, { headers: { "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300" } })
}
