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

export const load: PageLoad = async ({ fetch }) => {
  await moduleFilter.init(fetch)
  const [moduleRes, latestModuleUpdateRes] = await Promise.allSettled([
    fetch('/api/modules?extend=true'),
    fetch('/api/git/latestModuleUpdate')
  ])
  if (moduleRes.status === 'rejected') {
    throw error(500, { message: `Module konnten nicht geladen werden: ${moduleRes.reason}` })
  }

  const json: ModuleViewJson[] = await moduleRes.value.json()
  const modules: ModuleView[] = json.map((m) => ({
    ...m,
    moduleType: getModuleType(m.studyProgram)
  }))

  let latestModuleUpdate: Date | null = null
  if (latestModuleUpdateRes.status === 'fulfilled' && latestModuleUpdateRes.value.ok) {
    const latestModuleUpdate_: string | null = await latestModuleUpdateRes.value.json()
    if (latestModuleUpdate_) {
      latestModuleUpdate = new Date(latestModuleUpdate_)
    }
  }

  return { modules, latestModuleUpdate }
}
