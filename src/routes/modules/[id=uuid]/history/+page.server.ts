import { isParsed, type ModuleVersion } from '$lib/types/module-version'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ fetch, params }) => {
  const res = await fetch(`/auth-api/modules/${params.id}/history`)
  if (!res.ok) {
    const message: { message: string } = await res
      .json()
      .catch(() => ({ message: 'Unbekannter Fehler' }))
    throw error(res.status, message)
  }

  const history: ModuleVersion[] = await res.json()
  history.sort((a, b) => new Date(a.committedAt).getTime() - new Date(b.committedAt).getTime())
  const latestVersion = history.findLast(isParsed)

  if (!latestVersion) {
    throw error(404, { message: 'Keine aktuelle Version gefunden' })
  }

  const latestModule = latestVersion.content.module

  return { history, module: latestModule }
}
