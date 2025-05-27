import { getUserInfo, getValidAccessToken } from '$lib/server/auth'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ cookies, fetch }) => {
  const accessToken = await getValidAccessToken(cookies, fetch)

  if (accessToken) {
    const user = getUserInfo(accessToken)
    return { user }
  }

  return { user: undefined }
}
