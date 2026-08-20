import { NextResponse } from 'next/server'
import { getTitle } from '@/lib/data'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const title = await getTitle(id)

  if (!title) {
    return NextResponse.json({ error: 'Title not found' }, { status: 404 })
  }

  return NextResponse.json(title)
}
