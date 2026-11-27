import { getRequestEvent, query } from '$app/server'
import { poEctsFactorSchema } from '$lib/schemas/study-program'
import { fetchBackendJson } from '$lib/server/backend/http'
import { z } from 'zod/v4'

/** Distinct ECTS factors of the given POs; 30 if none can be determined. */
export const getEctsFactors = query(z.array(z.string()), async (ids) => {
  const { fetch } = getRequestEvent()
  const pos = await fetchBackendJson(
    fetch,
    `/api/pos?valid=false&ids=${ids.join(',')}`,
    z.array(poEctsFactorSchema),
    'ECTS-Faktoren konnten nicht geladen werden'
  ).catch((err) => {
    console.error('Error fetching POs:', err)
    return []
  })
  const factors = [...new Set(pos.map((po) => po.ectsFactor))]
  return factors.length > 0 ? factors : [30]
})
