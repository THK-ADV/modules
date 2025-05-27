import { authHeader, url } from '$lib/http.js'
import { moduleSchema } from '$lib/schemas/module.js'
import { getValidAccessToken } from '$lib/server/auth'
import type { ModuleProtocol } from '$lib/types/module-protocol.js'
import { error, redirect } from '@sveltejs/kit'
import { zod } from 'sveltekit-superforms/adapters'
import { superValidate } from 'sveltekit-superforms/server'
import type { LayoutServerLoad } from './$types.js'

async function fetchModule(
  id: string,
  accessToken: string,
  fetch: typeof globalThis.fetch
): Promise<ModuleProtocol> {
  const auth = authHeader(accessToken)
  const res = await fetch(`${url}/modules/${id}/latest`, auth)
  if (!res.ok) {
    const err = await res.json()
    const message = `Modul konnte nicht geladen werden: ${err.message}`
    throw error(res.status, { message })
  }
  return await res.json()
}

export const load: LayoutServerLoad = async ({ cookies, fetch, params }) => {
  const accessToken = await getValidAccessToken(cookies, fetch)
  if (!accessToken) {
    throw redirect(303, '/login')
  }
  const module = await fetchModule(params.id, accessToken, fetch)

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
      }
    },
    zod(moduleSchema)
  )
  return { module, accessToken, form }
}
