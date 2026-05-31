'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { getDeviceId } from '@/lib/deviceId'
import type { RoomState } from '@/lib/types'
import { PageContainer, SurfaceCard, PrimaryButton, SecondaryButton, StatusBadge, ScoreBar, GameBoard } from '@/app/_components'

export default function ResultPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.id as string
  const [room, setRoom] = useState<RoomState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [rematching, setRematching] = useState(false)
  const deviceId = getDeviceId()

  const isHost = room?.players.X.deviceId === deviceId

  useEffect(() => {
    const cancelled = false

    async function poll() {
      const interval = setInterval(async () => {
        if (cancelled) return
        try {
          const res = await apiFetch(`/api/room/${roomId}`)
          if (!res.ok) {
            if (res.status === 404) {
              setError('Room not found')
              clearInterval(interval)
            }
            return
          }
          const data: RoomState = await res.json()

          if (data.status === 'playing') {
            clearInterval(interval)
            router.push(`/room/${roomId}`)
            return
          }

          setRoom(data)
        } catch {
          // retry
        }
      }, 2000)

      return () => clearInterval(interval)
    }

    poll()
  }, [roomId, router])

  async function handleRematch() {
    setRematching(true)
    try {
      const res = await apiFetch(`/api/room/${roomId}/rematch`, {
        method: 'POST',
      })
      if (res.ok) {
        router.push(`/room/${roomId}`)
      } else {
        const data = await res.json()
        setError(data.error)
        setRematching(false)
      }
    } catch {
      setRematching(false)
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
          <div className="grid grid-cols-3 gap-1.5 w-full aspect-square max-w-[200px]">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="rounded-cell bg-elevated animate-pulse" />
            ))}
          </div>
          <p className="text-sm text-text-secondary animate-pulse">Loading result...</p>
        </SurfaceCard>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <SurfaceCard className="flex w-full max-w-sm flex-col items-center gap-8 p-8">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          {room.winner === 'draw' ? (
            <StatusBadge variant="default" className="text-base px-6 py-2">
              Draw
            </StatusBadge>
          ) : (
            <StatusBadge
              variant={room.winner === 'X' ? 'x' : 'o'}
              className="text-base px-6 py-2 animate-celebrate"
            >
              {room.winner === 'X' ? 'X' : 'O'} Wins!
            </StatusBadge>
          )}
          <p className="text-sm text-text-secondary">
            {room.winner === 'draw' ? 'No winner this round' : 'Takes the round'}
          </p>
        </div>

        <GameBoard
          board={room.board}
          readOnly
          className="w-full max-w-[250px]"
        />

        <ScoreBar scores={room.scores} currentTurn={null} round={room.round} />

        <div className="flex flex-col gap-3 w-full">
          {isHost && (
            <PrimaryButton onClick={handleRematch} disabled={rematching} className="w-full">
              {rematching ? 'Starting...' : 'Rematch'}
            </PrimaryButton>
          )}
          {!isHost && (
            <div className="flex items-center justify-center gap-2 rounded-badge bg-elevated px-4 py-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-text-muted animate-pulse" />
              <span className="text-xs text-text-secondary">Waiting for host to start a rematch...</span>
            </div>
          )}
          <SecondaryButton onClick={() => router.push('/')} className="w-full">
            Go Home
          </SecondaryButton>
        </div>
      </SurfaceCard>
    </PageContainer>
  )
}
