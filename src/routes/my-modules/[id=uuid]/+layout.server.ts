import { moduleSchema } from '$lib/schemas/module.js'
import { getValidAccessToken } from '$lib/server/auth.js'
import type { Approval } from '$lib/types/module-approval.js'
import type { ModuleDraftKeys } from '$lib/types/module-draft-keys.js'
import { getFieldModifications } from '$lib/types/module-draft-keys.js'
import { canEdit, type ModuleDraftState } from '$lib/types/module-draft.js'
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

  const moduleDraftStateRes = await fetch(`/api/moduleDrafts/${params.id}`)

  if (!moduleDraftStateRes.ok) {
    const err = await moduleDraftStateRes.json()
    const message = `Module Draft konnte nicht geladen werden: ${err.message}`
    throw error(moduleDraftStateRes.status, { message })
  }

  const state: { id: ModuleDraftState } = await moduleDraftStateRes.json()

  if (!canEdit(state.id)) {
    throw error(403, { message: 'Das Modul kann nicht bearbeitet werden.' })
  }

  const [moduleRes, moduleDraftKeysRes, approvalsRes, userWithUpdatePermissionsRes] =
    await Promise.allSettled([
      fetch(`/api/modules/${params.id}/latest`),
      fetch(`/api/moduleDrafts/${params.id}/keys`),
      fetch(`/api/moduleApprovals/${params.id}`),
      fetch(`/api/moduleUpdatePermissions/${params.id}?newApi=true`)
    ])

  if (moduleRes.status === 'rejected') {
    const err = moduleRes.reason
    const message = `Modul konnte nicht geladen werden: ${err}`
    throw error(500, { message })
  }

  if (!moduleRes.value.ok) {
    const err = await moduleRes.value.json()
    const message = `Modul konnte nicht geladen werden: ${err.message}`
    throw error(moduleRes.value.status, { message })
  }

  const module: ModuleProtocol = await moduleRes.value.json()
  let moduleDraftKeys: ModuleDraftKeys | null = null
  let approvals: Approval[] = []
  let userWithUpdatePermissions: string[] = []

  if (moduleDraftKeysRes.status === 'fulfilled' && moduleDraftKeysRes.value.ok) {
    moduleDraftKeys = await moduleDraftKeysRes.value.json()
  }

  if (approvalsRes.status === 'fulfilled' && approvalsRes.value.ok) {
    approvals = await approvalsRes.value.json()
  }

  if (
    userWithUpdatePermissionsRes.status === 'fulfilled' &&
    userWithUpdatePermissionsRes.value.ok
  ) {
    userWithUpdatePermissions = await userWithUpdatePermissionsRes.value.json()
  }

  // the backend does not return the id of the module if a module draft exists
  if (!module.id) {
    module.id = params.id
  }

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
      updatePermissions: userWithUpdatePermissions,
      firstExaminer: module.metadata.examiner.first,
      secondExaminer: module.metadata.examiner.second,
      examPhases: module.metadata.examPhases,
      assessmentMethods: module.metadata.assessmentMethods.mandatory,
      workload: {
        lecture: module.metadata.workload.lecture,
        seminar: module.metadata.workload.seminar,
        exercise: module.metadata.workload.exercise,
        practical: module.metadata.workload.practical,
        projectSupervision: module.metadata.workload.projectSupervision,
        projectWork: module.metadata.workload.projectWork
      },
      recommendedPrerequisites,
      requiredPrerequisites,
      po: {
        mandatory: module.metadata.po.mandatory,
        optional: module.metadata.po.optional
      },
      participants: module.metadata.participants,
      moduleRelation: module.metadata.moduleRelation,
      taughtWith: module.metadata.taughtWith,
      deContent: module.deContent,
      enContent: module.enContent,
      attendanceRequirement: module.metadata.attendanceRequirement,
      assessmentPrerequisite: module.metadata.assessmentPrerequisite
    },
    zod(moduleSchema)
  )

  const fieldStatuses = getFieldModifications(moduleDraftKeys)

  return { module, moduleDraftKeys, approvals, fieldStatuses, accessToken, form }
}
