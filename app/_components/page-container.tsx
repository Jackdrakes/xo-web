import type { ReactNode } from 'react'

export function PageContainer({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`flex min-h-dvh flex-col items-center justify-center px-6 py-12 ${className}`}
    >
      {children}
    </div>
  )
}
