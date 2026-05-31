'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { getDeviceId } from '@/lib/deviceId'
import type { RoomState } from '@/lib/types'
import { PageContainer, SurfaceCard, PrimaryButton, SecondaryButton, StatusBadge } from '@/app/_components'

export default function WaitingPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.id as string
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [myRole, setMyRole] = useState<'X' | 'O' | null>(null)
  const deviceId = getDeviceId()

  const inviteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/room/${roomId}`
    : ''

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: select text manually
    }
  }

  useEffect(() => {
    apiFetch(`/api/room/${roomId}/join`, { method: 'POST' }).catch(() => {})

    const interval = setInterval(async () => {
      try {
        const res = await apiFetch(`/api/room/${roomId}`)
        if (!res.ok) {
          if (res.status === 404) {
            setError('Room not found')
            clearInterval(interval)
          }
          return
        }
        const room: RoomState = await res.json()

        if (room.players.X.deviceId === deviceId) {
          setMyRole('X')
        } else if (room.players.O.deviceId === deviceId) {
          setMyRole('O')
        }

        if (room.status === 'playing') {
          clearInterval(interval)
          router.push(`/room/${roomId}`)
        }
      } catch {
        // retry on next interval
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [roomId, router, deviceId])

  if (error) {
    return (
      <PageContainer>
        <SurfaceCard className="flex w-full max-w-sm flex-col items-center gap-6 p-5 sm:p-8">
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

  return (
    <PageContainer>
      <SurfaceCard className="flex w-full max-w-sm flex-col items-center gap-8 p-5 sm:p-8">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-xl font-semibold">Waiting for opponent</h1>
          <p className="text-sm text-text-secondary">Share this code or link</p>
        </div>

        <div className="w-full border-2 border-dashed border-border rounded-card p-5 sm:p-8 text-center">
          <p className="text-4xl sm:text-5xl font-mono font-bold tracking-[0.15em] text-text-primary">
            {roomId}
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          {myRole && (
            <StatusBadge variant={myRole.toLowerCase() as 'x' | 'o'} className="self-center">
              You are Player {myRole}
            </StatusBadge>
          )}

          <PrimaryButton onClick={copyLink} className="w-full">
            {copied ? 'Copied!' : 'Copy Invite Link'}
          </PrimaryButton>
        </div>

        <div className="flex items-center gap-2 text-text-muted">
          <span className="h-2 w-2 rounded-full bg-accent-x animate-pulse" />
          <span className="text-sm">Waiting for player to join...</span>
        </div>

        <SecondaryButton onClick={() => router.push('/')} className="w-full">
          Back to Home
        </SecondaryButton>
      </SurfaceCard>
    </PageContainer>
  )
}
