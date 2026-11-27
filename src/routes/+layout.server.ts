import { getUser, getValidAccessToken } from '$lib/server/auth'
import { getSidebarState } from '$lib/stores/sidebar-state'
import type { LayoutServerLoad } from './$types'
import { getCurrentUserInfo } from './user-info.remote'

export const load: LayoutServerLoad = async ({ cookies, fetch }) => {
  const accessToken = await getValidAccessToken(cookies, fetch)
  const sidebarOpen = getSidebarState(cookies)

  if (accessToken) {
    const [user, userInfo] = await Promise.all([getUser(accessToken, fetch), getCurrentUserInfo()])
    return { isAuthenticated: true, user, userInfo, sidebarOpen }
  }

  return { isAuthenticated: false, user: undefined, userInfo: undefined, sidebarOpen }
}
