import { getRequestEvent, query } from '$app/server'
import { getUserInfo } from '$lib/server/auth'

/** Permissions of the signed-in user; loads and queries of one request share a single fetch. */
export const getCurrentUserInfo = query(() => getUserInfo(getRequestEvent().fetch))
