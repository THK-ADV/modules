import { dev } from '$app/environment'
import { env } from '$env/dynamic/private'
import type { User, UserInfo } from '$lib/auth'
import { error, type Cookies } from '@sveltejs/kit'

// caution: all functions should only be called within a server context

const AccessTokenKey = 'kc-access'

const AccessTokenExpiresAtKey = 'kc-access-exp'

const RefreshTokenKey = 'kc-refresh'

const tokenEndpoint = `${env.KEYCLOAK_URL}/realms/${env.KEYCLOAK_REALM}/protocol/openid-connect/token`

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseJwt(token: string): any | undefined {
  try {
    const [, payloadB64] = token.split('.')
    const base64 = payloadB64.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const json = new TextDecoder().decode(Uint8Array.from(atob(padded), (c) => c.charCodeAt(0)))
    return JSON.parse(json)
  } catch {
    return undefined
  }
}

// TODO: the access token expires in 23 hours. make it so that the token is refreshed when the home page is loaded
function shouldRefreshToken(cookies: Cookies): boolean {
  const exp = cookies.get(AccessTokenExpiresAtKey)
  if (!exp) {
    return true
  }
  try {
    const expTime = Date.parse(decodeURIComponent(exp))
    const currTime = Date.now()
    const timeUntilExpiry = expTime - currTime

    // refresh if token will expire in less than 10 minutes (600 seconds)
    return timeUntilExpiry < 600
  } catch {
    // assume refreshing if there is an error
    return true
  }
}

// refresh the access token if the refresh token is present
async function refreshAccessToken(
  cookies: Cookies,
  fetch: typeof globalThis.fetch
): Promise<string | undefined> {
  const refreshToken = cookies.get(RefreshTokenKey)

  if (!refreshToken) {
    return undefined
  }

  const formData = new URLSearchParams()
  formData.append('grant_type', 'refresh_token')
  formData.append('client_id', env.KEYCLOAK_CLIENT_ID)
  formData.append('refresh_token', refreshToken)

  const res = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formData.toString()
  })

  if (!res.ok) {
    const errorText = await res.text()
    const message = `Failed to refresh token: ${errorText}`
    throw error(res.status, { message })
  }

  const json = await res.json()

  setCookies(cookies, json)

  return json.access_token
}

// get a valid access token, refreshing if necessary
export async function getValidAccessToken(
  cookies: Cookies,
  fetch: typeof globalThis.fetch
): Promise<string | undefined> {
  const accessToken = cookies.get(AccessTokenKey)

  if (!accessToken) {
    return undefined
  }

  if (shouldRefreshToken(cookies)) {
    return refreshAccessToken(cookies, fetch)
  }

  return accessToken
}

export function getUser(accessToken: string): User | undefined {
  const token = parseJwt(accessToken)
  if (!token) {
    return undefined
  }
  return {
    firstname: token.firstname,
    lastname: token.lastname,
    roles: token.realm_access.roles,
    userInfo: undefined
  }
}

export async function getUserInfo(fetch: typeof globalThis.fetch): Promise<UserInfo | undefined> {
  const res = await fetch('/api/me?newApi=true')
  if (!res.ok) {
    return undefined
  }
  try {
    return await res.json()
  } catch (err) {
    console.error(err)
    return undefined
  }
}

export function setCookies(
  cookies: Cookies,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { access_token, expires_in, refresh_token, refresh_expires_in }: any
) {
  cookies.set(AccessTokenKey, access_token, {
    path: '/',
    httpOnly: true,
    secure: !dev,
    sameSite: 'lax',
    maxAge: expires_in
  })

  cookies.set(RefreshTokenKey, refresh_token, {
    path: '/',
    httpOnly: true,
    secure: !dev,
    sameSite: 'lax',
    maxAge: refresh_expires_in
  })

  // store token expiry for refresh logic

  const expiresAt = new Date()
  expiresAt.setSeconds(expiresAt.getSeconds() + expires_in)

  cookies.set(AccessTokenExpiresAtKey, expiresAt.toISOString(), {
    path: '/',
    httpOnly: true,
    secure: !dev,
    sameSite: 'lax',
    maxAge: expires_in
  })
}

export function deleteCookies(cookies: Cookies) {
  cookies.delete(AccessTokenKey, { path: '/' })
  cookies.delete(AccessTokenExpiresAtKey, { path: '/' })
  cookies.delete(RefreshTokenKey, { path: '/' })
}

export function loginUrl(baseUrl: string, redirectTo: string = '/'): string {
  const realmUrl = `${env.KEYCLOAK_URL}/realms/${env.KEYCLOAK_REALM}/protocol/openid-connect/auth`
  const params = new URLSearchParams()
  params.append('response_type', 'code')
  params.append('scope', 'openid profile email')
  params.append('redirect_uri', `${baseUrl}/auth?redirectTo=${encodeURIComponent(redirectTo)}`)
  params.append('client_id', env.KEYCLOAK_CLIENT_ID)
  return `${realmUrl}?${params.toString()}`
}

export function logoutUrl(baseUrl: string, redirectTo: string = '/'): string {
  const realmUrl = `${env.KEYCLOAK_URL}/realms/${env.KEYCLOAK_REALM}/protocol/openid-connect/logout`
  const params = new URLSearchParams()
  params.append('client_id', env.KEYCLOAK_CLIENT_ID)
  params.append('post_logout_redirect_uri', `${baseUrl}${redirectTo}`)
  return `${realmUrl}?${params.toString()}`
}

// revoke the refresh token on the Keycloak server (optional but recommended)
async function revokeRefreshToken(cookies: Cookies, fetch: typeof globalThis.fetch): Promise<void> {
  const refreshToken = cookies.get(RefreshTokenKey)

  if (!refreshToken) {
    return
  }

  try {
    const endpoint = `${env.KEYCLOAK_URL}/realms/${env.KEYCLOAK_REALM}/protocol/openid-connect/revoke`
    const params = new URLSearchParams()
    params.append('client_id', env.KEYCLOAK_CLIENT_ID)
    params.append('token', refreshToken)
    params.append('token_type_hint', 'refresh_token')

    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    })
  } catch (err) {
    // log the error but don't throw - logout should still proceed
    console.error('Failed to revoke refresh token:', err)
  }
}

// perform a complete logout: revoke tokens, clear cookies, and return logout URL
export async function performLogout(
  cookies: Cookies,
  fetch: typeof globalThis.fetch,
  baseUrl: string,
  redirectTo: string = '/'
): Promise<string> {
  await revokeRefreshToken(cookies, fetch)
  deleteCookies(cookies)
  return logoutUrl(baseUrl, redirectTo)
}

// exchanges the auth code for access token
export async function exchangeToken(
  baseUrl: string,
  authCode: string,
  cookies: Cookies,
  fetch: typeof globalThis.fetch,
  redirectUri: string | null
): Promise<void> {
  try {
    const endpoint = `${env.KEYCLOAK_URL}/realms/${env.KEYCLOAK_REALM}/protocol/openid-connect/token`
    let finalRedirectUri = `${baseUrl}/auth`
    if (redirectUri) {
      finalRedirectUri += `?redirectTo=${encodeURIComponent(redirectUri)}`
    }

    const params = new URLSearchParams()
    params.append('grant_type', 'authorization_code')
    params.append('client_id', env.KEYCLOAK_CLIENT_ID)
    params.append('code', authCode)
    params.append('redirect_uri', finalRedirectUri)

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw error(response.status, {
        message: `Failed to exchange authorization code: ${errorText}`
      })
    }

    const json = await response.json()
    setCookies(cookies, json)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    throw error(500, { message })
  }
}
