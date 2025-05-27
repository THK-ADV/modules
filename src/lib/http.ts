export const url = 'https://module.gm.th-koeln.de/api'

export function authHeader(accessToken: string) {
	return {
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	}
}
