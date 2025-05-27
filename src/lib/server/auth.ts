import { dev } from '$app/environment'
import { KEYCLOAK_CLIENT_ID, KEYCLOAK_REALM, KEYCLOAK_URL } from '$env/static/private'
import type { User } from '$lib/auth'
import { error, type Cookies } from '@sveltejs/kit'

// caution: all functions should only be called within a server context

const AccessTokenKey = 'kc-access'

const AccessTokenExpiresAtKey = 'kc-access-exp'

const RefreshTokenKey = 'kc-refresh'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parserJwt(token: string): any | undefined {
  try {
    const [, payloadB64] = token.split('.')
    const json = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json)
  } catch {
    return undefined
  }
}

function shouldRefreshToken(cookies: Cookies): boolean {
  const exp = cookies.get(AccessTokenExpiresAtKey)
  if (!exp) {
    return true
  }
  try {
    const expTime = Date.parse(decodeURIComponent(exp))
    const currTime = Date.now()
    const timeUntilExpiry = expTime - currTime

    // refresh if token will expire in less than 5 minutes (300 seconds)
    return timeUntilExpiry < 300
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

  const tokenEndpoint = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`

  const formData = new URLSearchParams()
  formData.append('grant_type', 'refresh_token')
  formData.append('client_id', KEYCLOAK_CLIENT_ID)
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

export function getUserInfo(accessToken: string): User | undefined {
  const token = parserJwt(accessToken)
  if (!token) {
    return undefined
  }
  return {
    firstname: token.firstname,
    lastname: token.lastname,
    roles: token.realm_access.roles
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

export function loginUrl(baseUrl: string): string {
  const realmUrl = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/auth`
  const params = new URLSearchParams()
  params.append('response_type', 'code')
  params.append('scope', 'openid profile email')
  params.append('redirect_uri', `${baseUrl}/auth`)
  params.append('client_id', KEYCLOAK_CLIENT_ID)
  return `${realmUrl}?${params.toString()}`
}

// exchanges the auth code for access token
export async function exchangeToken(
  baseUrl: string,
  authCode: string,
  cookies: Cookies,
  fetch: typeof globalThis.fetch
): Promise<void> {
  try {
    const endpoint = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`
    const redirectUri = `${baseUrl}/auth`

    const params = new URLSearchParams()
    params.append('grant_type', 'authorization_code')
    params.append('client_id', KEYCLOAK_CLIENT_ID)
    params.append('code', authCode)
    params.append('redirect_uri', redirectUri)

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
