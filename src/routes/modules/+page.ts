import { moduleFilter } from '$lib/store.svelte'
import type { ModuleView } from '$lib/types/module'
import { error } from '@sveltejs/kit'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ fetch, params }) => {
  await moduleFilter.init(fetch)
  const res = await fetch('/api/modules?extend=true')
  if (!res.ok) {
    throw error(res.status, `Failed to load ${params}`)
  }
  const modules: ModuleView[] = await res.json()
  for (const m of modules) {
    m.studyProgram.sort((a, b) =>
      a.studyProgram.abbreviation.localeCompare(b.studyProgram.abbreviation)
    )
  }
  return { modules }
}
