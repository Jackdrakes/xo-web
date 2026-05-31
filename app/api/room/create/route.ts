import { NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { createInitialRoom } from '@/lib/gameLogic'
import { createRoom } from '@/lib/roomStore'

export async function POST() {
  try {
    const id = nanoid(8).toUpperCase()
    const room = createInitialRoom(id)
    await createRoom(id, room)
    return NextResponse.json({ roomId: id })
  } catch {
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 },
    )
  }
}
