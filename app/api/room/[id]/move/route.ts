import { NextRequest, NextResponse } from 'next/server'
import { getRoom, setRoom } from '@/lib/roomStore'
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

    const room = await getRoom(id)
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    if (room.status !== 'playing') {
      return NextResponse.json({ error: 'Game is not in progress' }, { status: 400 })
    }

    const playerRole =
      room.players.X.deviceId === deviceId
        ? 'X'
        : room.players.O.deviceId === deviceId
          ? 'O'
          : null
    if (!playerRole) {
      return NextResponse.json(
        { error: 'You are not a player in this room' },
        { status: 403 },
      )
    }

    if (playerRole !== room.currentTurn) {
      return NextResponse.json({ error: 'Not your turn' }, { status: 400 })
    }

    if (room.board[cellIndex] !== null) {
      return NextResponse.json({ error: 'Cell already taken' }, { status: 400 })
    }

    room.board[cellIndex] = playerRole
    room.version++

    const winner = checkWin(room.board)
    if (winner) {
      room.winner = winner
      room.status = 'finished'
      room.scores[winner as 'X' | 'O']++
      await setRoom(id, room)
      return NextResponse.json(room)
    }

    if (checkDraw(room.board)) {
      room.winner = 'draw'
      room.status = 'finished'
      await setRoom(id, room)
      return NextResponse.json(room)
    }

    room.currentTurn = room.currentTurn === 'X' ? 'O' : 'X'
    await setRoom(id, room)
    return NextResponse.json(room)
  } catch {
    return NextResponse.json({ error: 'Failed to make move' }, { status: 500 })
  }
}
