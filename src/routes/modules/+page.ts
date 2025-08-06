import { moduleFilter } from '$lib/store.svelte'
import type {
  ModuleType,
  ModuleView,
  ModuleViewJson,
  StudyProgramModuleAssociation
} from '$lib/types/module'
import { error } from '@sveltejs/kit'
import type { PageLoad } from './$types'

function getModuleType(studyPrograms: StudyProgramModuleAssociation[]): ModuleType | undefined {
  let mandatory = false
  let elective = false
  for (const s of studyPrograms) {
    if (s.mandatory) {
      mandatory = true
    } else {
      elective = true
    }
  }
  if (mandatory && !elective) {
    return { id: 'pm', label: 'Pflichtmodul', abbrev: 'PM' }
  } else if (!mandatory && elective) {
    return { id: 'wm', label: 'Wahlmodul', abbrev: 'WM' }
  } else if (mandatory && elective) {
    return { id: 'pwm', label: 'Als Modul wählbar', abbrev: 'P/WM' }
  } else {
    return undefined
  }
}

export const load: PageLoad = async ({ fetch, params }) => {
  await moduleFilter.init(fetch)
  const res = await fetch('/api/modules?extend=true')
  if (!res.ok) {
    throw error(res.status, `Failed to load ${params}`)
  }
  const json: ModuleViewJson[] = await res.json()
  const modules: ModuleView[] = json.map((m) => ({
    ...m,
    moduleType: getModuleType(m.studyProgram)
  }))
  return { modules }
}
