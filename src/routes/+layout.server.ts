import { getUser, getUserInfo, getValidAccessToken } from '$lib/server/auth'
import { getSidebarState } from '$lib/stores/sidebar-state'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ cookies, fetch }) => {
  const accessToken = await getValidAccessToken(cookies, fetch)
  const sidebarOpen = getSidebarState(cookies)

  if (accessToken) {
    const user = getUser(accessToken)
    const userInfo = await getUserInfo(fetch)
    return { accessToken, user, userInfo, sidebarOpen }
  }

  return { accessToken, user: undefined, userInfo: undefined, sidebarOpen }
}
