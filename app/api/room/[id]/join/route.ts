import { NextRequest, NextResponse } from 'next/server'
import { updateRoom, RoomActionError } from '@/lib/roomStore'

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

    const room = await updateRoom(id, (room) => {
      if (room.status === 'playing' || room.status === 'finished') {
        throw new RoomActionError('Room is already started')
      }

      const x = room.players.X
      const o = room.players.O

      if (x.deviceId === deviceId && x.joined) return room
      if (o.deviceId === deviceId && o.joined) return room

      if (!x.joined) {
        room.players.X = { deviceId, joined: true }
        return room
      }

      if (!o.joined) {
        room.players.O = { deviceId, joined: true }
        room.status = 'playing'
        return room
      }

      throw new RoomActionError('Room is full')
    })

    return NextResponse.json(room)
  } catch (e) {
    if (e instanceof RoomActionError) {
      return NextResponse.json({ error: e.message }, { status: e.statusCode })
    }
    return NextResponse.json({ error: 'Failed to join room' }, { status: 500 })
  }
}
