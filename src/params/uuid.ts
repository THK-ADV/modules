import { isUUID } from '$lib/utils'
import type { ParamMatcher } from '@sveltejs/kit'

export const match: ParamMatcher = (param) => {
	return isUUID(param)
}
