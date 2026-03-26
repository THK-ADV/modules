import { browser } from '$app/environment'
import type { PaginationState } from '@tanstack/table-core'

export function getArrayFromLocalStorage(key: string): string[] {
  if (!browser) {
    return []
  }
  const value = localStorage.getItem(key)
  if (value) {
    return value.split(',')
  }
  return []
}

export function setArrayToLocalStorage(key: string, value: string[]) {
  if (!browser) {
    return
  }
  localStorage.setItem(key, value.join(','))
}

export function clearItemFromLocalStorage(key: string) {
  if (!browser) {
    return
  }
  localStorage.removeItem(key)
}

export function setBooleanToLocalStorage(key: string, value: boolean) {
  if (!browser) {
    return
  }
  localStorage.setItem(key, value.toString())
}

export function getPaginationFromLocalStorage(
  key: string,
  defaultPageSize: number
): PaginationState {
  if (!browser) {
    return { pageIndex: 0, pageSize: defaultPageSize }
  }

  const raw = localStorage.getItem(key)
  if (raw) {
    const [pageIndexStr, pageSizeStr] = raw.split(',')
    const pageIndex = Number.parseInt(pageIndexStr ?? '', 10)
    const pageSize = Number.parseInt(pageSizeStr ?? '', 10)

    if (!Number.isFinite(pageIndex) || pageIndex < 0) {
      return { pageIndex: 0, pageSize: defaultPageSize }
    }
    if (!Number.isFinite(pageSize) || pageSize <= 0) {
      return { pageIndex: 0, pageSize: defaultPageSize }
    }

    return { pageIndex, pageSize }
  }

  return { pageIndex: 0, pageSize: defaultPageSize }
}

export function setPaginationToLocalStorage(key: string, { pageIndex, pageSize }: PaginationState) {
  if (!browser) {
    return
  }
  localStorage.setItem(key, `${pageIndex},${pageSize}`)
}
