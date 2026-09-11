import type { ParamMatcher } from '@sveltejs/kit'
import { z } from 'zod/v4'

export const match: ParamMatcher = (param) => z.uuid().safeParse(param).success
