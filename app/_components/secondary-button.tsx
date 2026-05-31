import type { ReactNode, ButtonHTMLAttributes } from 'react'

export function SecondaryButton({
  children,
  className = '',
  ...props
}: {
  children: ReactNode
  className?: string
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-button border border-border bg-surface px-6 py-3 text-sm font-medium text-text-secondary hover:bg-elevated active:scale-[0.97] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
