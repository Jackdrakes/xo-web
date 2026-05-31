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

export async function setRoom(id: string, state: RoomState): Promise<void> {
  await getRedis().set(`${ROOM_PREFIX}${id}`, state, { ex: TTL })
}
