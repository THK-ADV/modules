import { moduleSchema } from '$lib/schemas/module.js'
import { getValidAccessToken } from '$lib/server/auth.js'
import type { ModuleProtocol } from '$lib/types/module-protocol.js'
import { error, redirect } from '@sveltejs/kit'
import { zod } from 'sveltekit-superforms/adapters'
import { superValidate } from 'sveltekit-superforms/server'
import type { LayoutServerLoad } from './$types.js'

export const load: LayoutServerLoad = async ({ fetch, params, cookies, url }) => {
  const accessToken = await getValidAccessToken(cookies, fetch)

  if (!accessToken) {
    throw redirect(303, `/login?redirectTo=${encodeURIComponent(url.pathname)}`)
  }
  const res = await fetch(`/api/modules/${params.id}/latest`)

  if (!res.ok) {
    const err = await res.json()
    const message = `Modul konnte nicht geladen werden: ${err.message}`
    throw error(res.status, { message })
  }

  const module: ModuleProtocol = await res.json()

  let recommendedPrerequisites = null
  if (module.metadata.prerequisites.recommended) {
    recommendedPrerequisites = {
      text: module.metadata.prerequisites.recommended.text,
      modules: module.metadata.prerequisites.recommended.modules
    }
  }

  let requiredPrerequisites = null
  if (module.metadata.prerequisites.required) {
    requiredPrerequisites = {
      text: module.metadata.prerequisites.required.text,
      modules: module.metadata.prerequisites.required.modules
    }
  }

  const form = await superValidate(
    {
      title: module.metadata.title,
      abbrev: module.metadata.abbrev,
      moduleType: module.metadata.moduleType,
      ects: module.metadata.ects,
      language: module.metadata.language,
      duration: module.metadata.duration,
      season: module.metadata.season,
      location: module.metadata.location,
      status: module.metadata.status,
      management: module.metadata.moduleManagement,
      lecturers: module.metadata.lecturers,
      updatePermissions: [], // TODO: add update permissions
      firstExaminer: module.metadata.examiner.first,
      secondExaminer: module.metadata.examiner.second,
      examPhases: module.metadata.examPhases,
      assessmentMethods: [
        ...module.metadata.assessmentMethods.mandatory,
        { method: 'attendance', percentage: null, precondition: [] }
      ],
      workload: {
        lecture: module.metadata.workload.lecture,
        seminar: module.metadata.workload.seminar,
        exercise: module.metadata.workload.exercise,
        practical: module.metadata.workload.practical,
        projectSupervision: module.metadata.workload.projectSupervision,
        projectWork: module.metadata.workload.projectWork
      },
      recommendedPrerequisites,
      requiredPrerequisites
    },
    zod(moduleSchema)
  )
  return { module, accessToken, form }
}
