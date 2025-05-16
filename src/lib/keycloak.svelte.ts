import Keycloak from 'keycloak-js'

export type User = {
	firstname: string
	lastname: string
	roles: string[]
}

export function isEmployee(user: User): boolean {
	return user.roles.includes('employee')
}

function decodeJwt(token: string) {
	const [, payloadB64] = token.split('.')
	const json = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))
	return JSON.parse(json)
}

function setCookie(document: Document, name: string, value: string, maxAge: number) {
	document.cookie = `${name}=${value}; Max-Age=${maxAge}; path=/; SameSite=strict`
}

function createKeycloak() {
	const config = {
		url: 'https://auth.gm.fh-koeln.de:8444/auth',
		realm: 'schedule',
		clientId: 'frontend-dev'
	}
	const keycloak = new Keycloak(config)
	const accessTokenKey = 'kc-access'
	const refreshTokenKey = 'kc-refresh'

	return {
		init(window: Window) {
			console.log('kc init...')
			if (keycloak.didInitialize) {
				console.log('already done')
				return
			}
			return keycloak
				.init({
					onLoad: 'check-sso',
					silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html'
				})
				.then((auth) => {
					let user: User | undefined

					if (auth) {
						if (keycloak.token && keycloak.tokenParsed?.iat && keycloak?.tokenParsed?.exp) {
							const maxAge = Math.abs(keycloak.tokenParsed.iat - keycloak.tokenParsed.exp)
							setCookie(window.document, accessTokenKey, keycloak.token, maxAge)
						}

						if (
							keycloak.refreshToken &&
							keycloak.refreshTokenParsed?.iat &&
							keycloak.refreshTokenParsed?.exp
						) {
							const maxAge = Math.abs(
								keycloak.refreshTokenParsed.iat - keycloak.refreshTokenParsed.exp
							)
							setCookie(window.document, refreshTokenKey, keycloak.refreshToken, maxAge)
						}

						if (
							keycloak.tokenParsed?.realm_access?.roles &&
							keycloak.tokenParsed?.firstname &&
							keycloak.tokenParsed?.lastname
						) {
							user = {
								firstname: keycloak.tokenParsed?.firstname,
								lastname: keycloak.tokenParsed?.lastname,
								roles: keycloak.tokenParsed?.realm_access?.roles
							}
						}
					}
					return user
				})
				.catch((err) => {
					console.error(err)
					return undefined
				})
		},
		async login() {
			await keycloak.login()
		},
		async logout() {
			await keycloak.logout()
		},
		getUserInfo(document: Document): User | undefined {
			const accessToken = this.getAccessToken(document)
			if (!accessToken) {
				return undefined
			}
			const { firstname, lastname, realm_access } = decodeJwt(accessToken)
			return { firstname, lastname, roles: realm_access.roles }
		},
		getAccessToken(document: Document): string | undefined {
			if (!document.cookie) {
				return undefined
			}
			const accessToken = document.cookie
				.split(`; `)
				.find((s) => s.startsWith(accessTokenKey))
				?.slice(accessTokenKey.length + 1)
			if (!accessToken) {
				// console.log('no access token cookie set')
				return undefined
			}
			// console.log('access token cookie set', accessToken)
			return accessToken
		},
		getRefreshToken(document: Document): string | undefined {
			if (!document.cookie) {
				return undefined
			}
			const refreshToken = document.cookie
				.split(`; `)
				.find((s) => s.startsWith(refreshTokenKey))
				?.slice(refreshTokenKey.length + 1)
			if (!refreshToken) {
				// console.log('no refresh token cookie set')
				return undefined
			}
			// console.log('refresh token cookie set', refreshToken)
			return refreshToken
		},
		async refreshToken(
			document: Document,
			fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
		): Promise<string | undefined> {
			const refreshToken = this.getRefreshToken(document)
			if (!refreshToken) {
				// TODO handle
				return undefined
			}

			const params = new URLSearchParams()
			params.append('grant_type', 'refresh_token')
			params.append('refresh_token', refreshToken)
			params.append('client_id', config.clientId)
			const realmUrl = `${config.url}/realms/${config.realm}/protocol/openid-connect/token`

			const res = await fetch(realmUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded'
				},
				body: params.toString()
			})
			if (!res.ok) {
				const err = await res.text()
				throw new Error(`Token refresh failed: ${res.status} ${err}`)
			}

			const { access_token, expires_in, refresh_token, refresh_expires_in } = await res.json()
			setCookie(window.document, accessTokenKey, access_token, expires_in)
			setCookie(window.document, refreshTokenKey, refresh_token, refresh_expires_in)
			return access_token
		}
	}
}

export const keycloak = createKeycloak()
