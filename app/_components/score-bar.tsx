import type { RoomState } from '@/lib/types'

export function ScoreBar({
  scores,
  currentTurn,
  round,
}: {
  scores: RoomState['scores']
  currentTurn: RoomState['currentTurn'] | null
  round: number
}) {
  return (
    <div className="flex w-full items-center justify-between rounded-xl bg-elevated px-5 py-3">
      <div
        className={`flex items-center gap-2.5 rounded-badge px-3.5 py-1.5 transition-all duration-200 ${
          currentTurn === 'X'
            ? 'bg-accent-x-soft text-accent-x ring-1 ring-accent-x/20'
            : 'text-text-secondary'
        }`}
      >
        <span className="text-sm font-bold">X</span>
        <span className="text-lg font-bold tabular-nums">{scores.X}</span>
      </div>

      <div className="text-xs font-medium text-text-muted">
        Round {round}
      </div>

      <div
        className={`flex items-center gap-2.5 rounded-badge px-3.5 py-1.5 transition-all duration-200 ${
          currentTurn === 'O'
            ? 'bg-accent-o-soft text-accent-o ring-1 ring-accent-o/20'
            : 'text-text-secondary'
        }`}
      >
        <span className="text-sm font-bold">O</span>
        <span className="text-lg font-bold tabular-nums">{scores.O}</span>
      </div>
    </div>
  )
}
