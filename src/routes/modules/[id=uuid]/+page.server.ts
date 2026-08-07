import { MODULE_ROUTE_ID } from '$lib/routes'
import type { GenericModuleOption } from '$lib/schemas/module-details'
import { fetchModuleDetail } from '$lib/server/backend/module-details'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ fetch, params }) => {
  const module = await fetchModuleDetail(fetch, params.id)
  let genericModuleOptions: GenericModuleOption[] = []

  if (module.moduleType.id === 'generic_module') {
    const optionsRes = await fetch(`/api/modules/${params.id}/options`)
    if (optionsRes.ok) {
      genericModuleOptions = await optionsRes.json()
      genericModuleOptions.sort((a, b) => a.title.localeCompare(b.title))
    }
  }

  return {
    module,
    genericModuleOptions,
    breadcrumbLabels: { [MODULE_ROUTE_ID]: module.title }
  }
}
