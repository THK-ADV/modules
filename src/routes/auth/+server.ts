import { exchangeToken } from '$lib/server/auth'
import { error, redirect } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url, cookies, fetch }) => {
  const code = url.searchParams.get('code')

  if (!code) {
    throw error(400, { message: 'Authorization code missing' })
  }

  await exchangeToken(url.origin, code, cookies, fetch)
  throw redirect(303, url.origin)
}
