import { NextRequest, NextResponse } from 'next/server'
import { updateRoom, RoomActionError } from '@/lib/roomStore'
import { createEmptyBoard, swapRoles } from '@/lib/gameLogic'

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
      if (room.players.X.deviceId !== deviceId) {
        throw new RoomActionError('Only the host can start a rematch', 403)
      }

      if (room.status !== 'finished') {
        throw new RoomActionError('Game is not finished')
      }

      room.board = createEmptyBoard()
      room.currentTurn = 'X'
      room.winner = null
      room.status = 'playing'
      room.round++
      room.players = swapRoles(room.players)

      return room
    })

    return NextResponse.json(room)
  } catch (e) {
    if (e instanceof RoomActionError) {
      return NextResponse.json({ error: e.message }, { status: e.statusCode })
    }
    return NextResponse.json({ error: 'Failed to rematch' }, { status: 500 })
  }
}
