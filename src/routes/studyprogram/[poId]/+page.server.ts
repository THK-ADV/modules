import { STUDYPROGRAM_ROUTE_ID } from '$lib/routes'
import { fetchModuleCatalogConfigOptions } from '$lib/server/backend/module-catalog'
import type { StudyProgram } from '$lib/types/study-program'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { fmtStudyProgram } from '$lib/formats'

interface StudyProgramPrivilege {
  studyProgram: StudyProgram
  canPreview: boolean
  canCreate: boolean
}

export const load: PageServerLoad = async ({ fetch, params }) => {
  const [options, privilegesRes] = await Promise.all([
    fetchModuleCatalogConfigOptions(fetch, params.poId),
    fetch('/auth-api/user-privileges')
  ])

  if (!privilegesRes.ok) {
    throw error(privilegesRes.status, { message: 'Berechtigungen konnten nicht geladen werden' })
  }

  const privileges: StudyProgramPrivilege[] = await privilegesRes.json()
  const matching = privileges.filter((p) => p.studyProgram.po.id === params.poId)

  if (matching.length === 0) {
    throw error(404, { message: 'Studiengang wurde nicht gefunden' })
  }

  const studyProgram = matching[0].studyProgram

  return {
    options,
    studyProgram,
    canCreate: matching.some((p) => p.canCreate),
    breadcrumbLabels: { [STUDYPROGRAM_ROUTE_ID]: fmtStudyProgram(studyProgram) }
  }
}
