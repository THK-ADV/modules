import { getUser, getUserInfo, getValidAccessToken } from '$lib/server/auth'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ cookies, fetch }) => {
  const accessToken = await getValidAccessToken(cookies, fetch)

  if (accessToken) {
    const user = getUser(accessToken)
    const userInfo = await getUserInfo(fetch)
    return { accessToken, user, userInfo }
  }

  return { accessToken, user: undefined, userInfo: undefined }
}
