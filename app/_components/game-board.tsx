'use client'

type BoardCell = string | null

export function getWinLine(board: BoardCell[]): number[] | null {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ]
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return [a, b, c]
    }
  }
  return null
}

export function GameBoard({
  board,
  onCellClick,
  disabled,
  winLine,
  readOnly,
  className = '',
}: {
  board: BoardCell[]
  onCellClick?: (index: number) => void
  disabled?: boolean
  winLine?: number[] | null
  readOnly?: boolean
  className?: string
}) {
  const resolvedWinLine = winLine ?? getWinLine(board)

  return (
    <div
      className={`grid grid-cols-3 gap-1.5 w-full aspect-square ${className}`}
    >
      {board.map((cell, i) => {
        const isWinning = resolvedWinLine?.includes(i)
        const CellTag = readOnly ? 'div' : 'button'
        const interactive = !readOnly && !cell && !disabled

        let cellClass = ''
        if (isWinning) {
          cellClass =
            'ring-2 ring-emerald-400/50 ring-offset-2 bg-emerald-50/50 animate-pop-in'
        } else if (cell) {
          cellClass = 'bg-elevated'
        } else if (readOnly) {
          cellClass = 'bg-white/50'
        } else {
          cellClass =
            'bg-white shadow-cell cursor-pointer hover:shadow-md hover:-translate-y-[1px] active:scale-[0.97]'
        }

        return (
          <CellTag
            key={i}
            onClick={interactive ? () => onCellClick?.(i) : undefined}
            disabled={!readOnly ? !interactive : undefined}
            className={`flex items-center justify-center rounded-cell text-5xl font-black tracking-tight transition-all duration-200 ${cellClass} ${
              interactive ? '' : 'cursor-default'
            }`}
          >
            {cell && (
              <span
                className={`animate-pop-in ${
                  cell === 'X' ? 'text-accent-x' : 'text-accent-o'
                }`}
              >
                {cell}
              </span>
            )}
          </CellTag>
        )
      })}
    </div>
  )
}
