'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { apiFetch } from '@/lib/api'
import { PageContainer, SurfaceCard, PrimaryButton } from '@/app/_components'

export default function Home() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  async function createRoom() {
    setLoading(true)
    try {
      const res = await apiFetch('/api/room/create', { method: 'POST' })
      const data = await res.json()
      router.push(`/room/${data.roomId}/waiting`)
    } catch {
      setLoading(false)
    }
  }

  function joinRoom(e: FormEvent) {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (trimmed.length > 0) {
      router.push(`/room/${trimmed}`)
    }
  }

  return (
    <PageContainer>
      <SurfaceCard className="flex w-full max-w-sm flex-col items-center gap-8 p-5 sm:p-8">
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-6xl sm:text-7xl font-black tracking-tight">XO</h1>
          <p className="text-sm text-text-secondary">
            Tic Tac Toe with friends
          </p>
        </div>

        <div className="flex w-full flex-col gap-3">
          <PrimaryButton onClick={createRoom} disabled={loading}>
            {loading ? 'Creating...' : 'Start a Game'}
          </PrimaryButton>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-text-muted">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={joinRoom} className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter code"
              maxLength={8}
              className="flex-1 rounded-button border border-border bg-surface px-4 py-3 text-center font-mono text-base uppercase tracking-[0.15em] text-text-primary placeholder:text-text-muted focus:border-accent-x focus:outline-none focus:ring-2 focus:ring-accent-x/20 transition-all duration-150"
            />
            <PrimaryButton
              type="submit"
              disabled={code.trim().length === 0}
              className="px-5"
            >
              Join
            </PrimaryButton>
          </form>
        </div>
      </SurfaceCard>
    </PageContainer>
  )
}
