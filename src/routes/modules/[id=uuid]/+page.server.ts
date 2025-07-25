import { parseErrorMessage } from '$lib/http'
import type { GenericModuleOption, ModuleDetail } from '$lib/types/module-details'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ fetch, params, url }) => {
  const source = url.searchParams.get('source')
  const uri =
    source === 'latest'
      ? `/api/modules/${params.id}/latest/file`
      : `/api/modules/${params.id}?extend=true`

  const res = await fetch(uri)
  if (res.ok) {
    if (source === 'latest') {
      const file = await res.text()
      return { file }
    } else {
      const module: ModuleDetail = await res.json()
      let genericModuleOptions: GenericModuleOption[] = []

      if (module.moduleType === 'Generisches Modul') {
        const res = await fetch(`/api/modules/${params.id}/options`)
        if (res.ok) {
          genericModuleOptions = await res.json()
          genericModuleOptions.sort((a, b) => a.title.localeCompare(b.title))
        }
      }

      return { module, genericModuleOptions }
    }
  } else if (res.status === 404) {
    throw error(res.status, { message: `Das Modul konnte nicht gefunden werden` })
  } else {
    const errorMsg = parseErrorMessage(await res.json())
    throw error(res.status, { message: `Das Modul konnte nicht geladen werden: ${errorMsg}` })
  }
}
