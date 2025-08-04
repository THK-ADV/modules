import type { PO } from './types/core'

export async function getPOsWithIds(ids: string[]) {
  try {
    const res = await fetch(`/api/pos?valid=false&ids=${ids.join(',')}`)
    if (res.ok) {
      const pos: PO[] = await res.json()
      return pos
    } else {
      return []
    }
  } catch (err) {
    console.error('Error fetching POs:', err)
    return []
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseErrorMessage(err: any) {
  if (err.message) {
    return err.message
  }
  return JSON.stringify(err)
}
