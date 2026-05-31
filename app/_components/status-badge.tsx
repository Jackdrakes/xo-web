import type { ReactNode } from 'react'

const variants = {
  default:
    'bg-elevated text-text-secondary',
  x: 'bg-accent-x-soft text-accent-x',
  o: 'bg-accent-o-soft text-accent-o',
  active:
    'bg-elevated text-text-primary ring-1 ring-border-strong',
  success:
    'bg-emerald-50 text-emerald-700',
} as const

export function StatusBadge({
  children,
  variant = 'default',
  className = '',
}: {
  children: ReactNode
  variant?: keyof typeof variants
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-badge px-3 py-1 text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
