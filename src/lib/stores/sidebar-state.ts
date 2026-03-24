import type { Cookies } from '@sveltejs/kit'

const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_COOKIE_NAME = 'sidebar:state'

export function setSidebarState(open: boolean, doc: Document) {
  doc.cookie = `${SIDEBAR_COOKIE_NAME}=${open}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
}

export function getSidebarState(cookies: Cookies): boolean {
  const value = cookies.get(SIDEBAR_COOKIE_NAME)
  if (value) {
    return value === 'true'
  } else {
    return true
  }
}
