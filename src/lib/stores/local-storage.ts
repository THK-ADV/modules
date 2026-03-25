import { browser } from '$app/environment'

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
