import { NextRequest, NextResponse } from 'next/server'
import { updateRoom, RoomActionError } from '@/lib/roomStore'
import { checkWin, checkDraw } from '@/lib/gameLogic'

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

    const body = await request.json()
    const cellIndex = body.cellIndex as number

    if (typeof cellIndex !== 'number' || cellIndex < 0 || cellIndex > 8) {
      return NextResponse.json(
        { error: 'Invalid cell index' },
        { status: 400 },
      )
    }

    const room = await updateRoom(id, (room) => {
      if (room.status !== 'playing') {
        throw new RoomActionError('Game is not in progress')
      }

      const playerRole =
        room.players.X.deviceId === deviceId
          ? 'X'
          : room.players.O.deviceId === deviceId
            ? 'O'
            : null
      if (!playerRole) {
        throw new RoomActionError('You are not a player in this room', 403)
      }

      if (playerRole !== room.currentTurn) {
        throw new RoomActionError('Not your turn')
      }

      if (room.board[cellIndex] !== null) {
        throw new RoomActionError('Cell already taken')
      }

      room.board[cellIndex] = playerRole

      const winner = checkWin(room.board)
      if (winner) {
        room.winner = winner
        room.status = 'finished'
        room.scores[winner as 'X' | 'O']++
      } else if (checkDraw(room.board)) {
        room.winner = 'draw'
        room.status = 'finished'
      } else {
        room.currentTurn = room.currentTurn === 'X' ? 'O' : 'X'
      }

      return room
    })

    return NextResponse.json(room)
  } catch (e) {
    if (e instanceof RoomActionError) {
      return NextResponse.json({ error: e.message }, { status: e.statusCode })
    }
    return NextResponse.json({ error: 'Failed to make move' }, { status: 500 })
  }
}
