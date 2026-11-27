import { MODULE_ROUTE_ID } from '$lib/routes'
import { isParsed, moduleVersionSchema } from '$lib/schemas/module-version'
import { fetchBackendJson } from '$lib/server/backend/http'
import { error } from '@sveltejs/kit'
import { z } from 'zod/v4'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ fetch, params }) => {
  const history = await fetchBackendJson(
    fetch,
    `/auth-api/modules/${params.id}/history`,
    z.array(moduleVersionSchema),
    'Modulhistorie konnte nicht geladen werden'
  )
  history.sort((a, b) => new Date(a.committedAt).getTime() - new Date(b.committedAt).getTime())
  const latestVersion = history.findLast(isParsed)

  if (!latestVersion) {
    throw error(404, { message: 'Keine aktuelle Version gefunden' })
  }

  const latestModule = latestVersion.content.module

  return {
    history,
    module: latestModule,
    breadcrumbLabels: { [MODULE_ROUTE_ID]: latestModule.title }
  }
}
