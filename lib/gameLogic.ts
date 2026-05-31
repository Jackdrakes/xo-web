import type { Player, RoomState } from './types'

const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

export function checkWin(board: (string | null)[]): string | null {
  for (const combo of WINNING_COMBOS) {
    const [a, b, c] = combo
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a]
    }
  }
  return null
}

export function checkDraw(board: (string | null)[]): boolean {
  return board.every((cell) => cell !== null)
}

export function createEmptyBoard(): (string | null)[] {
  return Array(9).fill(null)
}

export function swapRoles(
  players: RoomState['players'],
): RoomState['players'] {
  return {
    X: players.O,
    O: players.X,
  }
}

export function createInitialRoom(id: string): RoomState {
  return {
    id,
    status: 'waiting',
    board: createEmptyBoard(),
    currentTurn: 'X',
    winner: null,
    round: 1,
    players: {
      X: { deviceId: null, joined: false },
      O: { deviceId: null, joined: false },
    },
    scores: { X: 0, O: 0 },
    version: 1,
    createdAt: new Date().toISOString(),
  }
}
