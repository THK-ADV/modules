import { parseErrorMessage } from '$lib/http'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

// const res = await fetch(`/api/modules/${params.id}?extend=true`)
// const module: ModuleDetail = await res.json()

export const load: PageServerLoad = async ({ fetch, params, url }) => {
  const source = url.searchParams.get('source')
  const uri =
    source === 'latest' ? `/api/modules/${params.id}/latest/file` : `/api/modules/${params.id}/file`
  const res = await fetch(uri)
  if (res.ok) {
    const file = await res.text()
    return { file }
  } else if (res.status === 404) {
    throw error(res.status, { message: `Das Modul konnte nicht gefunden werden` })
  } else {
    const errorMsg = parseErrorMessage(await res.json())
    throw error(res.status, { message: `Das Modul konnte nicht geladen werden: ${errorMsg}` })
  }
}
