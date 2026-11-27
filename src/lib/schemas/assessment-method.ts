import { z } from 'zod/v4'

/** Number of modules per assessment method ID of `/assessmentMethods/counts`. */
export const assessmentMethodCountsSchema = z.record(z.string(), z.number())
