import type { PO } from './types/core'

export const url = 'https://module.gm.th-koeln.de/api'

export function authHeader(accessToken: string) {
  return {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  }
}

export async function getPOsWithIds(ids: string[]) {
  const res = await fetch(`${url}/pos?valid=false&ids=${ids.join(',')}`)
  if (res.ok) {
    const pos: PO[] = await res.json()
    return pos
  } else {
    return []
  }
}
