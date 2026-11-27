import { MODULE_ROUTE_ID } from '$lib/routes'
import { genericModuleOptionSchema } from '$lib/schemas/module-details'
import { fetchBackendJson } from '$lib/server/backend/http'
import { fetchModuleDetail } from '$lib/server/backend/module-details'
import { z } from 'zod/v4'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ fetch, params }) => {
  const module = await fetchModuleDetail(fetch, params.id)
  // Optional: a generic module without loadable options shows none.
  const genericModuleOptions =
    module.moduleType.id === 'generic_module'
      ? await fetchBackendJson(
          fetch,
          `/api/modules/${params.id}/options`,
          z.array(genericModuleOptionSchema),
          'Wählbare Module konnten nicht geladen werden'
        ).then(
          (xs) => xs.sort((a, b) => a.title.localeCompare(b.title)),
          () => []
        )
      : []

  return {
    module,
    genericModuleOptions,
    breadcrumbLabels: { [MODULE_ROUTE_ID]: module.title }
  }
}
