import { NextRequest, NextResponse } from 'next/server'
import { getRoom, setRoom } from '@/lib/roomStore'
import { createEmptyBoard, checkWin, checkDraw, swapRoles } from '@/lib/gameLogic'

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

    if (room.players.X.deviceId !== deviceId) {
      return NextResponse.json(
        { error: 'Only the host can start a rematch' },
        { status: 403 },
      )
    }

    room.board = createEmptyBoard()
    room.currentTurn = 'X'
    room.winner = null
    room.status = 'playing'
    room.round++
    room.players = swapRoles(room.players)
    room.version++

    await setRoom(id, room)
    return NextResponse.json(room)
  } catch {
    return NextResponse.json({ error: 'Failed to rematch' }, { status: 500 })
  }
}
