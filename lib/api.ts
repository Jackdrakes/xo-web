import { getDeviceId } from './deviceId'

export async function apiFetch(url: string, options?: RequestInit) {
  const deviceId = getDeviceId()
  const headers = new Headers(options?.headers)
  headers.set('Content-Type', 'application/json')
  if (deviceId) {
    headers.set('X-Device-ID', deviceId)
  }
  return fetch(url, { ...options, headers })
}
