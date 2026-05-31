import type { ReactNode } from 'react'

export function SurfaceCard({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-card bg-surface shadow-card ${className}`}
    >
      {children}
    </div>
  )
}
