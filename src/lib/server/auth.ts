import { dev } from '$app/environment'
import { KEYCLOAK_CLIENT_ID, KEYCLOAK_REALM, KEYCLOAK_URL } from '$env/static/private'
import type { User, UserInfo } from '$lib/auth'
import { error, type Cookies } from '@sveltejs/kit'

// caution: all functions should only be called within a server context

const AccessTokenKey = 'kc-access'

const AccessTokenExpiresAtKey = 'kc-access-exp'

const RefreshTokenKey = 'kc-refresh'
const AuthStateKey = 'kc-oidc-state'
const PkceVerifierKey = 'kc-oidc-pkce'

export const authStateCookieName = AuthStateKey

const tokenEndpoint = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`
const jwksEndpoint = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/certs`

const issuer = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}`

function base64UrlToBytes(input: string): Uint8Array {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const bin = atob(padded)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  const base64 = btoa(bin)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function randomBase64Url(bytes: number): string {
  const buf = new Uint8Array(bytes)
  crypto.getRandomValues(buf)
  return bytesToBase64Url(buf)
}

async function sha256Base64Url(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return bytesToBase64Url(new Uint8Array(digest))
}

type JwksCache = {
  fetchedAtMs: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jwks: any
}

let jwksCache: JwksCache | undefined

async function getJwks(fetch: typeof globalThis.fetch) {
  const ttlMs = 10 * 60 * 1000
  if (jwksCache && Date.now() - jwksCache.fetchedAtMs < ttlMs) return jwksCache.jwks

  const res = await fetch(jwksEndpoint)
  if (!res.ok) throw error(res.status, { message: 'Failed to fetch JWKS' })
  const jwks = await res.json()
  jwksCache = { fetchedAtMs: Date.now(), jwks }
  return jwks
}

async function verifyJwtRs256(
  token: string,
  fetch: typeof globalThis.fetch
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any | undefined> {
  try {
    const [headerB64, payloadB64, sigB64] = token.split('.')
    if (!headerB64 || !payloadB64 || !sigB64) return undefined

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const header: any = JSON.parse(new TextDecoder().decode(base64UrlToBytes(headerB64)))
    const kid = header.kid
    if (typeof kid !== 'string' || !kid) return undefined

    const findKey = async () => {
      const jwks = await getJwks(fetch)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (jwks.keys as any[] | undefined)?.find((k) => k.kid === kid)
    }

    let key = await findKey()
    if (!key) {
      // key rotation: retry once with fresh JWKS
      jwksCache = undefined
      key = await findKey()
      if (!key) return undefined
    }

    const alg = header.alg
    if (alg !== 'RS256') return undefined

    const cryptoKey = await crypto.subtle.importKey(
      'jwk',
      key,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    )

    const signingInput = new TextEncoder().encode(`${headerB64}.${payloadB64}`)
    const signature = base64UrlToBytes(sigB64)
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', cryptoKey, signature, signingInput)
    if (!ok) return undefined

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payloadB64)))

    if (payload.iss !== issuer) return undefined
    if (typeof payload.exp === 'number' && Date.now() / 1000 >= payload.exp) return undefined
    if (typeof payload.nbf === 'number' && Date.now() / 1000 < payload.nbf) return undefined

    const audOk =
      payload.azp === KEYCLOAK_CLIENT_ID ||
      payload.aud === KEYCLOAK_CLIENT_ID ||
      (Array.isArray(payload.aud) && payload.aud.includes(KEYCLOAK_CLIENT_ID))
    if (!audOk) return undefined

    return payload
  } catch {
    return undefined
  }
}

export function getExpectedAuthState(cookies: Cookies): string | undefined {
  return cookies.get(AuthStateKey)
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

    // refresh if token will expire in less than 10 minutes
    return timeUntilExpiry < 10 * 60 * 1000
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

export async function getUser(
  accessToken: string,
  fetch: typeof globalThis.fetch
): Promise<User | undefined> {
  const token = await verifyJwtRs256(accessToken, fetch)
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
  const res = await fetch('/auth-api/user')
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

export function deleteAuthAttemptCookies(cookies: Cookies) {
  cookies.delete(AuthStateKey, { path: '/' })
  cookies.delete(PkceVerifierKey, { path: '/' })
}

// revoke the refresh token on the Keycloak server (optional but recommended)
async function revokeRefreshToken(cookies: Cookies, fetch: typeof globalThis.fetch): Promise<void> {
  const refreshToken = cookies.get(RefreshTokenKey)
  if (!refreshToken) return

  try {
    const endpoint = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/revoke`
    const params = new URLSearchParams()
    params.append('client_id', KEYCLOAK_CLIENT_ID)
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

// perform a local-only logout: revoke refresh token (optional), clear cookies/session, and return local redirect
export async function performLogout(
  cookies: Cookies,
  fetch: typeof globalThis.fetch,
  baseUrl: string,
  redirectTo: string = '/'
): Promise<string> {
  await revokeRefreshToken(cookies, fetch)
  deleteCookies(cookies)
  deleteAuthAttemptCookies(cookies)
  return `${baseUrl}${redirectTo}`
}

export async function buildLoginRedirect(
  cookies: Cookies,
  baseUrl: string,
  redirectTo: string
): Promise<string> {
  const state = randomBase64Url(32)
  const codeVerifier = randomBase64Url(64)
  const codeChallenge = await sha256Base64Url(codeVerifier)

  cookies.set(AuthStateKey, state, {
    path: '/',
    httpOnly: true,
    secure: !dev,
    sameSite: 'lax',
    maxAge: 10 * 60
  })
  cookies.set(PkceVerifierKey, codeVerifier, {
    path: '/',
    httpOnly: true,
    secure: !dev,
    sameSite: 'lax',
    maxAge: 10 * 60
  })

  const realmUrl = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/auth`
  const params = new URLSearchParams()
  params.append('response_type', 'code')
  params.append('scope', 'openid profile email')
  params.append('redirect_uri', `${baseUrl}/auth?redirectTo=${encodeURIComponent(redirectTo)}`)
  params.append('client_id', KEYCLOAK_CLIENT_ID)
  params.append('state', state)
  params.append('code_challenge_method', 'S256')
  params.append('code_challenge', codeChallenge)
  return `${realmUrl}?${params.toString()}`
}

// exchanges the auth code for access token
export async function exchangeToken(
  baseUrl: string,
  authCode: string,
  cookies: Cookies,
  fetch: typeof globalThis.fetch,
  redirectUri: string | null
): Promise<void> {
  const codeVerifier = cookies.get(PkceVerifierKey)
  if (!codeVerifier) {
    throw error(400, { message: 'Missing PKCE verifier for login attempt' })
  }

  const endpoint = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`
  let finalRedirectUri = `${baseUrl}/auth`
  if (redirectUri) {
    finalRedirectUri += `?redirectTo=${encodeURIComponent(redirectUri)}`
  }

  const params = new URLSearchParams()
  params.append('grant_type', 'authorization_code')
  params.append('client_id', KEYCLOAK_CLIENT_ID)
  params.append('code', authCode)
  params.append('redirect_uri', finalRedirectUri)
  params.append('code_verifier', codeVerifier)

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
  deleteAuthAttemptCookies(cookies)
}
