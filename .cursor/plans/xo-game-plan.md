# XO Game — Build Plan

## Overview

A real-time multiplayer Tic-Tac-Toe game built with Next.js App Router. Two players share a room link — one creates, the other joins. Device IDs in localStorage persist identity across page refreshes. Polling keeps both clients in sync. No login, no names, no database.

---

## 1. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.2.6 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State sync | Polling (GET every 2s) |
| Identity | Device ID (`crypto.randomUUID` → localStorage) |
| Room storage | Upstash Redis (REST API, `@upstash/redis`) |
| Room TTL | 15 minutes per room, refreshed on activity (join, move, rematch) |
| Room ID | `nanoid(8)` uppercase alphanumeric |

---

## 2. Pages (4 routes)

| Route | Purpose |
|---|---|
| `/` | Landing — hero, "Start a Game" CTA, code entry input for joining |
| `/room/[id]/waiting` | Host waits for player 2. Shows share link with copy button. |
| `/room/[id]` | Game board, turn indicator, player labels, scores, rematch button |
| `/room/[id]/result` | Winner/draw announcement, score summary, options to rematch or go home |

### Flow

```
Landing → click "Start" → /room/[id]/waiting
                                ↓ P2 joins via shared link
                           /room/[id] (playing)
                                ↓ game ends
                           /room/[id]/result
                                ↓ host clicks Rematch
                           /room/[id] (board reset, roles swapped)
```

---

## 3. Identity — Device ID

- **First visit**: Check `localStorage.getItem('xo_did')`. If absent, call `crypto.randomUUID()`, persist to `localStorage`.
- **Every API call**: Send device ID as `X-Device-ID` HTTP header.
- **Join**: Server records `players.X.deviceId` or `players.O.deviceId` when a device connects.
- **Reconnect**: On page refresh, device ID matches stored record — player reclaims their role.
- **No names, no login, no cookies.**

---

## 4. Real-Time Sync — Polling

- Client calls `GET /api/room/[id]` every **2 seconds**.
- Each room state has a `version` counter, incremented on every mutation.
- Client caches the last `version` — if unchanged, skip re-render.
- After a move POST, the client immediately fetches once (don't wait for next poll tick).
- No WebSockets, no SSE, no custom server.

---

## 5. API Routes

All under `app/api/room/`.

| Method | Path | Action |
|---|---|---|
| POST | `/api/room/create` | Generate `nanoid(8)`, write initial room state, return `{ roomId }` |
| GET | `/api/room/[id]` | Return full room state (for polling) |
| POST | `/api/room/[id]/join` | Second player joins. Validate: room exists, not full, device not already assigned. Assign O role. |
| POST | `/api/room/[id]/move` | Make a move. Validate: correct turn, cell empty, device ID matches current player. Check win/draw after. |
| POST | `/api/room/[id]/rematch` | Host only (player X). Reset board, swap X/O roles, increment round, keep scores. |

---

## 6. Room Schema + TTL

Stored in Upstash Redis as a JSON blob per room keyed at `room:{id}`.

```json
{
  "a3f9bc12": {
    "id": "a3f9bc12",
    "status": "waiting | playing | finished",
    "board": ["X", null, "O", null, null, null, null, null, null],
    "currentTurn": "X",
    "winner": null | "X" | "O" | "draw",
    "round": 1,
    "players": {
      "X": { "deviceId": "uuid", "joined": true },
      "O": { "deviceId": null, "joined": false }
    },
    "scores": { "X": 0, "O": 0 },
    "version": 1,
    "createdAt": "2025-05-27T10:30:00Z"
  }
}
```

**TTL management**:
- **Create**: `SET room:{id} <json> EX 900` (15 min TTL)
- **Join / Move**: `EXPIRE room:{id} 900` — refresh TTL on each mutation
- **Rematch**: `SET room:{id} <updated-json> EX 900` — resets TTL with fresh 15 min
- **Expired rooms**: Redis auto-deletes. No cleanup job needed.

No `data/rooms.json`, no stale-room scanner. Redis handles expiry automatically.

---

## 7. File Structure

```
xo/
├── app/
│   ├── layout.tsx                        Root layout (Tailwind import, metadata)
│   ├── page.tsx                          Landing page
│   ├── room/[id]/
│   │   ├── page.tsx                      Game page (board, turn, scores, rematch)
│   │   ├── waiting/page.tsx              Waiting room (share link, copy button)
│   │   └── result/page.tsx               Result screen (winner, scores, options)
│   └── api/room/
│       ├── create/route.ts               POST — create room
│       └── [id]/
│           ├── route.ts                  GET — poll state
│           ├── join/route.ts             POST — join as P2
│           ├── move/route.ts             POST — make a move
│           └── rematch/route.ts          POST — host triggers rematch
├── lib/
│   ├── gameLogic.ts                      Win/draw detection, board helpers, role swap
│   ├── roomStore.ts                      Room CRUD via Upstash Redis
│   └── deviceId.ts                       Client: get or generate device ID
├── public/
│   └── (static assets if any)
├── .env.local                            UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
├── next.config.ts                        Next.js config
├── tailwind.config.ts                    Tailwind config
├── tsconfig.json                         TypeScript config
├── package.json                          Dependencies
├── postcss.config.mjs                    PostCSS for Tailwind
└── .gitignore                            Standard Next.js gitignore
```

---

## 8. Key Library Details

### `lib/gameLogic.ts`

```typescript
// Constants
const WINNING_COMBOS: number[][]  — all 8 win patterns
const BOARD_SIZE = 9

// Functions
checkWin(board): "X" | "O" | null         — check all combos
checkDraw(board): boolean                  — board full, no winner
createEmptyBoard(): (string | null)[]      — array of 9 nulls
swapRoles(players): Players                — X↔O on rematch
```

### `lib/roomStore.ts`

Uses `@upstash/redis` REST client (no persistent TCP connection, works in serverless).

```typescript
import { Redis } from "@upstash/redis"

const redis = Redis.fromEnv()  // reads UPSTASH_REDIS_REST_URL + _TOKEN from env

createRoom(id, state): RoomState        — redis.set(`room:${id}`, state, { ex: 900 })
getRoom(id): RoomState | null            — redis.get(`room:${id}`)
joinRoom(id, deviceId): RoomState        — assign O, set playing, redis.set with ex: 900
makeMove(id, cellIndex, deviceId): RoomState — validate, update, redis.set with ex: 900
rematch(id, deviceId): RoomState         — host check, reset board, swap, redis.set with ex: 900
```

All writes use `EX 900` to set/reset the 15-minute TTL. Redis auto-expires stale rooms.

### `lib/deviceId.ts`

```typescript
getDeviceId(): string                       — read or generate, persist to localStorage
```

---

## 9. Build Phases

### Phase 1 — Core Game Logic
- Scaffold Next.js 16 project with Tailwind
- Implement `gameLogic.ts` (win detection, draw, board helpers)
- Create `roomStore.ts` with Upstash Redis (`@upstash/redis`)
- Set up `.env.local` with `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- Wire `POST /api/room/create` (SET with EX 900) and `GET /api/room/[id]`
- Test: create a room, read it back, verify TTL in Upstash console

### Phase 2 — Basic Board & Move Flow
- Build `Board` component (3×3 grid, clickable cells)
- Create `POST /api/room/[id]/join` (assign O)
- Create `POST /api/room/[id]/move` (validate turn, update board, check result)
- Wire `/room/[id]/page.tsx` to poll state and render board
- Test: open two browser tabs, join, play a full game

### Phase 3 — Room UI & Flow
- Landing page: hero, "Start a Game" button, code entry input
- Waiting page (`/room/[id]/waiting`): invite link with copy-to-clipboard
- Result page (`/room/[id]/result`): winner overlay, scores
- `POST /api/room/[id]/rematch` — host triggers reset
- Device ID plumbing (`lib/deviceId.ts`)

### Phase 4 — Polish
- Turn indicator (whose turn, top of board)
- Player labels (device-based, show Player X / Player O)
- Highlight winning cells (optional visual)
- Score tracking across rounds
- Loading states (polling spinner, join pending)
- Error states (room not found, room full, wrong turn)
- Mobile responsive layout
- Edge cases: refresh mid-game, navigate away, invalid room URL

---

## 10. Edge Cases & Guards

| Scenario | Handling |
|---|---|
| Room not found | Poll returns 404 → show "Room not found" with link to landing |
| Room is full | Join returns error → show "Game already started" |
| Wrong device makes a move | Server rejects with 403 |
| Player refreshes mid-game | Device ID matches → reclaims role, board state unchanged |
| Both devices open same room | First to join = X, second = O. Subsequent joins rejected. |
| Host refreshes on waiting page | Device ID matches → re-assigned X, still waiting |
| Player navigates away | No explicit disconnect. Opponent sees stale board on poll. |
| Room expires (15 min TTL) | Redis auto-deletes. Poll returns null → "Room not found". |
| Rematch by non-host | Server rejects with 403 |
| Move after game finished | Server rejects with 400 |
| Cell already taken | Server rejects with 400 |

---

## 11. Dev Setup

```bash
npx create-next-app@latest xo --typescript --tailwind --app
cd xo
npm install nanoid @upstash/redis
npm run dev
```

**Environment Variables** — create `.env.local` with Upstash Redis credentials:

```
UPSTASH_REDIS_REST_URL=https://<your-region>.upstash.io
UPSTASH_REDIS_REST_TOKEN=<your-token>
```

Get these from [Upstash Console](https://console.upstash.com/) → create a Redis database (free tier: 10k commands/day, 50MB). The REST API works over HTTPS — no persistent TCP connection needed, perfect for serverless.

**Vercel deployment**: Add the same env vars in Vercel project settings. No other changes needed — `@upstash/redis` works identically in dev and production. Rooms survive cold starts since Redis is external.
