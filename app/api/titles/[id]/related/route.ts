import { NextResponse } from 'next/server'
import { getRelatedTitles } from '@/lib/data'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^(movie|tv)-[1-9]\d*$/.test(id)) return NextResponse.json({ error: 'Invalid title' }, { status: 400 })
  return NextResponse.json(await getRelatedTitles(id), { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600' } })
}
