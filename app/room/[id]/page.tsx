'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { getDeviceId } from '@/lib/deviceId'
import type { RoomState } from '@/lib/types'
import { PageContainer, SurfaceCard, PrimaryButton, StatusBadge, ScoreBar, GameBoard, getWinLine } from '@/app/_components'

export default function GamePage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.id as string
  const [room, setRoom] = useState<RoomState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [moveError, setMoveError] = useState<string | null>(null)
  const deviceId = getDeviceId()

  const myRole = room
    ? room.players.X.deviceId === deviceId
      ? 'X'
      : room.players.O.deviceId === deviceId
        ? 'O'
        : null
    : null

  const winLine = room?.status === 'finished' && room.winner && room.winner !== 'draw'
    ? getWinLine(room.board)
    : null

  useEffect(() => {
    const cancelled = false

    async function poll() {
      const interval = setInterval(async () => {
        if (cancelled) return
        try {
          const res = await apiFetch(`/api/room/${roomId}`)
          if (!res.ok) {
            if (res.status === 404) setError('Room not found')
            return
          }
          const data: RoomState = await res.json()

          if (data.status === 'waiting') {
            router.push(`/room/${roomId}/waiting`)
            return
          }

          setRoom(data)
          setMoveError(null)

          if (data.status === 'finished') {
            clearInterval(interval)
            router.push(`/room/${roomId}/result`)
          }
        } catch {
          // retry
        }
      }, 2000)

      return () => clearInterval(interval)
    }

    poll()
  }, [roomId, router])

  async function handleCellClick(cellIndex: number) {
    setMoveError(null)
    try {
      const res = await apiFetch(`/api/room/${roomId}/move`, {
        method: 'POST',
        body: JSON.stringify({ cellIndex }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMoveError(data.error)
        return
      }
      if (data.status === 'finished') {
        router.push(`/room/${roomId}/result`)
        return
      }
      setRoom(data)
    } catch {
      setMoveError('Failed to make move')
    }
  }

  if (error) {
    return (
      <PageContainer>
        <SurfaceCard className="flex w-full max-w-sm flex-col items-center gap-6 p-8">
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-xl font-semibold">{error}</h1>
            <p className="text-sm text-text-secondary">This room may have expired</p>
          </div>
          <PrimaryButton onClick={() => router.push('/')} className="w-full">
            Go Home
          </PrimaryButton>
        </SurfaceCard>
      </PageContainer>
    )
  }

  if (!room) {
    return (
      <PageContainer>
        <SurfaceCard className="flex w-full max-w-sm flex-col items-center gap-6 p-8">
          <div className="grid grid-cols-3 gap-1.5 w-full aspect-square">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="rounded-cell bg-elevated animate-pulse" />
            ))}
          </div>
          <p className="text-sm text-text-secondary animate-pulse">Loading game...</p>
        </SurfaceCard>
      </PageContainer>
    )
  }

  const myTurn = myRole === room.currentTurn

  return (
    <PageContainer>
      <SurfaceCard className="flex w-full max-w-[580px] flex-col items-center gap-8 p-8">
        <ScoreBar scores={room.scores} currentTurn={room.currentTurn} round={room.round} />

        <StatusBadge variant={myTurn ? 'active' : 'default'}>
          {myTurn && <span className="h-1.5 w-1.5 rounded-full bg-accent-x animate-pulse" />}
          {myTurn ? 'Your turn' : "Opponent's turn"}
        </StatusBadge>

        <GameBoard
          board={room.board}
          onCellClick={handleCellClick}
          disabled={!myTurn || room.status !== 'playing'}
          winLine={winLine}
          className="w-full max-w-[500px]"
        />

        {moveError && (
          <p className="text-xs text-accent-o">{moveError}</p>
        )}
      </SurfaceCard>
    </PageContainer>
  )
}
