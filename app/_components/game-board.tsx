'use client'

import { useRef } from 'react'
import { motion, type Variants } from 'framer-motion'

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

const cellVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.04, duration: 0.35, ease: 'easeOut' },
  }),
}

function MarkX() {
  return (
    <motion.svg
      viewBox="0 0 44 44"
      className="w-3/5 h-3/5 text-blue-400"
      initial="hidden"
      animate="visible"
    >
      <motion.path
        d="M 10 10 L 34 34"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
        variants={{
          hidden: { pathLength: 0 },
          visible: {
            pathLength: 1,
            transition: { duration: 0.3, ease: 'easeOut' },
          },
        }}
      />
      <motion.path
        d="M 34 10 L 10 34"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
        variants={{
          hidden: { pathLength: 0 },
          visible: {
            pathLength: 1,
            transition: { duration: 0.3, ease: 'easeOut', delay: 0.15 },
          },
        }}
      />
    </motion.svg>
  )
}

function MarkO() {
  return (
    <motion.svg
      viewBox="0 0 44 44"
      className="w-3/5 h-3/5 text-rose-400"
      initial="hidden"
      animate="visible"
    >
      <motion.circle
        cx="22"
        cy="22"
        r="12"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
        variants={{
          hidden: { pathLength: 0 },
          visible: {
            pathLength: 1,
            transition: { duration: 0.35, ease: 'easeOut' },
          },
        }}
      />
    </motion.svg>
  )
}

function getWinLineCoords(
  winLine: number[],
  boardEl: HTMLDivElement,
) {
  const { width: w, height: h } = boardEl.getBoundingClientRect()
  const pad = 8
  const gap = 8
  const cellW = (w - 2 * pad - 2 * gap) / 3
  const cellH = (h - 2 * pad - 2 * gap) / 3

  const getCenter = (index: number) => {
    const col = index % 3
    const row = Math.floor(index / 3)
    return {
      x: pad + col * (cellW + gap) + cellW / 2,
      y: pad + row * (cellH + gap) + cellH / 2,
    }
  }
  const a = getCenter(winLine[0])
  const b = getCenter(winLine[2])
  return { x1: a.x, y1: a.y, x2: b.x, y2: b.y }
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
  const boardRef = useRef<HTMLDivElement>(null)
  const resolvedWinLine = winLine ?? getWinLine(board)

  const winLineCoords =
    resolvedWinLine && boardRef.current
      ? getWinLineCoords(resolvedWinLine, boardRef.current)
      : null

  return (
    <div
      ref={boardRef}
      className={`relative rounded-2xl bg-[#0D0D14] shadow-2xl shadow-black/40 overflow-hidden w-full aspect-square ${className}`}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/[0.04] to-rose-500/[0.04] pointer-events-none" />
      <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_center,_rgba(96,165,250,0.06)_0%,_transparent_70%)] pointer-events-none" />

      <div className="absolute inset-[8px] grid grid-cols-3 gap-2">
          {board.map((cell, i) => {
            const isWinning = resolvedWinLine?.includes(i)
            const CellTag = readOnly ? 'div' : 'button'
            const interactive = !readOnly && !cell && !disabled

            let cellStyle = 'bg-white/[0.06] border-white/[0.08]'
            if (isWinning) {
              cellStyle = 'bg-white/[0.14] border-blue-400/30 ring-1 ring-blue-400/30'
            } else if (cell === 'X') {
              cellStyle = 'bg-blue-500/[0.12] border-blue-400/20'
            } else if (cell === 'O') {
              cellStyle = 'bg-rose-500/[0.12] border-rose-400/20'
            }

            return (
              <motion.div
                key={i}
                custom={i}
                variants={cellVariants}
                initial="hidden"
                animate="visible"
                className="relative"
              >
                <CellTag
                  onClick={interactive ? () => onCellClick?.(i) : undefined}
                  disabled={!readOnly ? !interactive : undefined}
                  className={`w-full rounded-xl backdrop-blur-xl border transition-colors duration-200 flex items-center justify-center aspect-square ${
                    cellStyle
                  } ${
                    interactive
                      ? 'cursor-pointer hover:bg-white/[0.10] hover:border-white/[0.15] active:scale-[0.95]'
                      : 'cursor-default'
                  }`}
                >
                  {cell === 'X' && <MarkX />}
                  {cell === 'O' && <MarkO />}
                </CellTag>
              </motion.div>
            )
          })}
        </div>

      {winLineCoords && (
        <motion.svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <defs>
            <linearGradient id="winGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="100%" stopColor="#FB7185" />
            </linearGradient>
            <filter id="winGlow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <motion.line
            {...winLineCoords}
            stroke="url(#winGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            filter="url(#winGlow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </motion.svg>
      )}
    </div>
  )
}
