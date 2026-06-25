import { parseErrorMessage } from '$lib/http'
import { MODULE_ROUTE_ID } from '$lib/routes'
import type { GenericModuleOption, ModuleDetail } from '$lib/types/module-details'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ fetch, params }) => {
  const res = await fetch(`/api/modules/${params.id}?extend=true`)

  if (res.ok) {
    const module: ModuleDetail = await res.json()
    let genericModuleOptions: GenericModuleOption[] = []
    let isGenericModule = false

    if (module.moduleType.id === 'generic_module') {
      const optionsRes = await fetch(`/api/modules/${params.id}/options`)
      if (optionsRes.ok) {
        isGenericModule = true
        genericModuleOptions = await optionsRes.json()
        genericModuleOptions.sort((a, b) => a.title.localeCompare(b.title))
      }
    }

    return {
      module,
      genericModuleOptions,
      isGenericModule,
      breadcrumbLabels: { [MODULE_ROUTE_ID]: module.title }
    }
  }

  if (res.status === 404) {
    throw error(res.status, { message: `Das Modul konnte nicht gefunden werden` })
  }

  const errorMsg = parseErrorMessage(await res.json())
  throw error(res.status, { message: `Das Modul konnte nicht geladen werden: ${errorMsg}` })
}
