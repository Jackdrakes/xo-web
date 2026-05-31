import { NextRequest, NextResponse } from 'next/server'
import { getRoom } from '@/lib/roomStore'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const room = await getRoom(id)
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }
  return NextResponse.json(room)
}
