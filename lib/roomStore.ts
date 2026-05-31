import { Redis } from '@upstash/redis'
import type { RoomState } from './types'

function createClient(): Redis {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error(
      'Upstash Redis not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env.local',
    )
  }
  return Redis.fromEnv()
}

let redis: Redis
function getRedis(): Redis {
  if (!redis) redis = createClient()
  return redis
}

const ROOM_PREFIX = 'room:'
const TTL = 900

const CAS_SCRIPT = `
if redis.call("EXISTS", KEYS[1]) == 0 then return -1 end
local cur = cjson.decode(redis.call("GET", KEYS[1]))
if cur.version ~= tonumber(ARGV[1]) then return 0 end
redis.call("SET", KEYS[1], ARGV[2], "EX", tonumber(ARGV[3]))
return 1
`

export class RoomActionError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message)
  }
}

export async function createRoom(
  id: string,
  state: RoomState,
): Promise<RoomState> {
  await getRedis().set(`${ROOM_PREFIX}${id}`, state, { ex: TTL })
  return state
}

export async function getRoom(id: string): Promise<RoomState | null> {
  return getRedis().get<RoomState>(`${ROOM_PREFIX}${id}`)
}

/**
 * Atomically read-modify-write a room using Lua CAS on the version field.
 * Retries up to 3 times on version conflict. If the callback throws (e.g.
 * validation error), the error propagates immediately without retry.
 */
export async function updateRoom(
  id: string,
  fn: (room: RoomState) => RoomState,
): Promise<RoomState> {
  const key = `${ROOM_PREFIX}${id}`

  for (let attempt = 0; attempt < 3; attempt++) {
    const room = await getRoom(id)
    if (!room) throw new RoomActionError('Room not found', 404)

    const expectedVersion = room.version
    const updated = fn(structuredClone(room))
    updated.version = expectedVersion + 1

    const result = await getRedis().eval(
      CAS_SCRIPT,
      [key],
      [String(expectedVersion), JSON.stringify(updated), String(TTL)],
    )

    if (result === 1 || result === '1') return updated
    if (result === -1 || result === '-1') throw new RoomActionError('Room not found', 404)
    // result === 0 → version conflict, retry with fresh state
  }

  throw new Error('Concurrency conflict: room changed during update, retries exhausted')
}

/** @deprecated Use updateRoom for atomic mutations */
export async function setRoom(id: string, state: RoomState): Promise<void> {
  await getRedis().set(`${ROOM_PREFIX}${id}`, state, { ex: TTL })
}
