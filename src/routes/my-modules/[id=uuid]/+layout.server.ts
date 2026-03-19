import { moduleSchema } from '$lib/schemas/module.js'
import { getValidAccessToken } from '$lib/server/auth.js'
import type { Approval } from '$lib/types/module-approval.js'
import type { ModuleDraftKeys } from '$lib/types/module-draft-keys.js'
import { getFieldModifications } from '$lib/types/module-draft-keys.js'
import { canEdit, type ModuleDraftState } from '$lib/types/module-draft.js'
import type { ModuleProtocol } from '$lib/types/module-protocol.js'
import type { ModuleReviewJson } from '$lib/types/review-request.js'
import { error, redirect } from '@sveltejs/kit'
import { superValidate } from 'sveltekit-superforms'
import { zod4 } from 'sveltekit-superforms/adapters'
import type { LayoutServerLoad } from './$types.js'

export type MyModulesMode = 'create' | 'review' | 'edit'

function parseMode(searchParams: URLSearchParams): MyModulesMode {
  switch (searchParams.get('mode')) {
    case 'create':
      return 'create'
    case 'review':
      return 'review'
    default:
      return 'edit'
  }
}

function createEmptyForm() {
  return superValidate({}, zod4(moduleSchema))
}

function createForm(module: ModuleProtocol, userWithUpdatePermissions: string[]) {
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

  return superValidate(
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
    zod4(moduleSchema)
  )
}

export const load: LayoutServerLoad = async ({ fetch, params, cookies, url }) => {
  const accessToken = await getValidAccessToken(cookies, fetch)

  if (!accessToken) {
    throw redirect(303, `/login?redirectTo=${encodeURIComponent(url.pathname)}`)
  }

  const mode = parseMode(url.searchParams)

  if (mode === 'create') {
    const form = await createEmptyForm()
    return {
      accessToken,
      form,
      mode,
      module: null,
      moduleDraftKeys: null,
      approvals: [],
      fieldStatuses: undefined,
      userWithUpdatePermissions: [],
      reviews: []
    }
  }

  const isReview = mode === 'review'
  const moduleDraftStateRes = await fetch(`/auth-api/moduleDrafts/${params.id}`)

  if (!moduleDraftStateRes.ok) {
    const err = await moduleDraftStateRes.json()
    const message = `Das Modul kann nicht bearbeitet werden: ${err.message}`
    throw error(moduleDraftStateRes.status, { message })
  }

  const state: { id: ModuleDraftState } = await moduleDraftStateRes.json()

  if (!isReview && !canEdit(state.id)) {
    throw error(403, { message: 'Das Modul kann nicht bearbeitet werden.' })
  }

  const [moduleRes, moduleDraftKeysRes, approvalsRes, userWithUpdatePermissionsRes, reviewsRes] =
    await Promise.allSettled([
      fetch(`/auth-api/modules/${params.id}/latest`),
      fetch(`/auth-api/moduleDrafts/${params.id}/keys`),
      fetch(`/auth-api/moduleReviews/${params.id}`),
      fetch(`/auth-api/moduleUpdatePermissions/${params.id}`),
      isReview ? fetch(`/auth-api/moduleReviews`) : null
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
  let reviews: { reviewId: string; role: string; studyProgram: string }[] = []

  if (reviewsRes.status === 'fulfilled' && reviewsRes.value?.ok) {
    const json: ModuleReviewJson[] = await reviewsRes.value.json()
    reviews = json
      .filter((a) => a.moduleId === params.id && a.canReview)
      .map((a) => {
        return {
          reviewId: a.reviewId,
          role: a.role.deLabel,
          studyProgram: a.studyProgram.deLabel
        }
      })
  }

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

  const form = await createForm(module, userWithUpdatePermissions)
  const fieldStatuses = getFieldModifications(moduleDraftKeys)

  return {
    accessToken,
    form,
    mode,
    module,
    moduleDraftKeys,
    approvals,
    fieldStatuses,
    userWithUpdatePermissions,
    reviews
  }
}
