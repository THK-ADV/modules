import { coreDataKeySchema } from '$lib/schemas/core-data'
import type { ParamMatcher } from '@sveltejs/kit'

export const match: ParamMatcher = (param) => coreDataKeySchema.safeParse(param).success
