export interface Player {
  deviceId: string | null
  joined: boolean
}

export interface RoomState {
  id: string
  status: 'waiting' | 'playing' | 'finished'
  board: (string | null)[]
  currentTurn: 'X' | 'O'
  winner: string | null
  round: number
  players: {
    X: Player
    O: Player
  }
  scores: {
    X: number
    O: number
  }
  version: number
  createdAt: string
}
