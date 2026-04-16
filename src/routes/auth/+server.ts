import {
  authStateCookieName,
  deleteAuthAttemptCookies,
  exchangeToken,
  getExpectedAuthState
} from '$lib/server/auth'
import { error, redirect } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url, cookies, fetch }) => {
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')

  if (!code) {
    throw error(400, { message: 'Authorization code missing' })
  }

  const expectedState = getExpectedAuthState(cookies)
  if (!state || !expectedState || state !== expectedState) {
    deleteAuthAttemptCookies(cookies)
    throw error(400, { message: `Invalid login state (${authStateCookieName})` })
  }

  const rawRedirectTo = url.searchParams.get('redirectTo')
  const redirectTo = rawRedirectTo && rawRedirectTo.startsWith('/') ? rawRedirectTo : null

  await exchangeToken(url.origin, code, cookies, fetch, redirectTo)

  throw redirect(303, url.origin + (redirectTo || '/'))
}
