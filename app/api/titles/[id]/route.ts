import { NextResponse } from 'next/server'
import { getTitle } from '@/lib/data'

export const dynamic = 'force-dynamic'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3005'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const [type, rawTmdbId] = id.split('-')
  const tmdbId = Number(rawTmdbId)
  if ((type === 'movie' || type === 'tv') && Number.isInteger(tmdbId) && tmdbId > 0) {
    await fetch(`${BACKEND_URL}/sync/item`, {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mediaType: type === 'movie' ? 'MOVIE' : 'TV',
        tmdbId,
      }),
    }).catch(() => {})
  }

  const title = await getTitle(id)

  if (!title) {
    return NextResponse.json({ error: 'Title not found' }, { status: 404 })
  }

  return NextResponse.json(title)
}
