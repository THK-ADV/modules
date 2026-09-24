import { z } from 'zod/v4'
import { publishedDocumentSchema } from '$lib/schemas/study-program-artifacts'
import { fetchBackendJson } from '$lib/server/backend/http'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ fetch }) => {
  const moduleCatalogs = await fetchBackendJson(
    fetch,
    '/api/moduleCatalogs',
    z.array(publishedDocumentSchema),
    'Modulhandbücher konnten nicht geladen werden'
  )
  return { moduleCatalogs }
}
