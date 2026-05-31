import { NextRequest, NextResponse } from 'next/server'
import { getRoom, setRoom } from '@/lib/roomStore'
import type { RoomState } from '@/lib/types'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const deviceId = request.headers.get('x-device-id')
    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device ID required' },
        { status: 400 },
      )
    }

    const room = await getRoom(id)
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    if (room.status === 'playing' || room.status === 'finished') {
      return NextResponse.json({ error: 'Room is already started' }, { status: 400 })
    }

    const x = room.players.X
    const o = room.players.O

    if (x.deviceId === deviceId && x.joined) {
      return NextResponse.json(room)
    }
    if (o.deviceId === deviceId && o.joined) {
      return NextResponse.json(room)
    }

    if (!x.joined) {
      room.players.X = { deviceId, joined: true }
      room.version++
      await setRoom(id, room)
      return NextResponse.json(room)
    }

    if (!o.joined) {
      room.players.O = { deviceId, joined: true }
      room.status = 'playing'
      room.version++
      await setRoom(id, room)
      return NextResponse.json(room)
    }

    return NextResponse.json({ error: 'Room is full' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Failed to join room' }, { status: 500 })
  }
}
