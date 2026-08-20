import { NextRequest, NextResponse } from 'next/server'
import { getGenres } from '@/lib/data'
import type { MediaType } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type')
  const genres = await getGenres(type === 'movie' || type === 'tv' ? (type as MediaType) : 'all')

  return NextResponse.json(genres)
}
