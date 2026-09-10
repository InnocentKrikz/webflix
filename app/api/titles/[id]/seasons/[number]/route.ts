import { NextResponse } from 'next/server'
import { getSeason } from '@/lib/data'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; number: string }> }) {
  const { id, number } = await params
  if (!/^tv-[1-9]\d*$/.test(id) || !/^\d+$/.test(number) || !Number.isSafeInteger(Number(number))) {
    return NextResponse.json({ error: 'Invalid season' }, { status: 400 })
  }
  const season = await getSeason(id, Number(number))
  return season ? NextResponse.json(season, { headers: { 'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=300' } }) : NextResponse.json({ error: 'Season unavailable' }, { status: 404 })
}
