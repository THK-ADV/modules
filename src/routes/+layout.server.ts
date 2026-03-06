import { SIDEBAR_COOKIE_NAME } from '$lib/components/ui/sidebar/constants'
import { getUser, getUserInfo, getValidAccessToken } from '$lib/server/auth'
import type { Cookies } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'

function isSidebarOpen(cookies: Cookies) {
  const value = cookies.get(SIDEBAR_COOKIE_NAME)
  if (value) {
    return value === 'true'
  } else {
    return true
  }
}

export const load: LayoutServerLoad = async ({ cookies, fetch }) => {
  const accessToken = await getValidAccessToken(cookies, fetch)
  const sidebarOpen = isSidebarOpen(cookies)

  if (accessToken) {
    const user = getUser(accessToken)
    const userInfo = await getUserInfo(fetch)
    return { accessToken, user, userInfo, sidebarOpen }
  }

  return { accessToken, user: undefined, userInfo: undefined, sidebarOpen }
}
