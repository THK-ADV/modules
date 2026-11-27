import { MY_MODULE_ROUTE_ID } from '$lib/routes.js'
import {
  moduleFormSchema,
  permittedAssessmentMethodsSchema,
  updatePermissionsSchema
} from '$lib/schemas/module.js'
import { approvalSchema } from '$lib/schemas/module-approval.js'
import { moduleDraftKeysSchema } from '$lib/schemas/module-draft.js'
import { moduleProtocolSchema, type ModuleProtocol } from '$lib/schemas/module-protocol.js'
import { moduleReviewEntrySchema } from '$lib/schemas/module-review.js'
import { getValidAccessToken } from '$lib/server/auth.js'
import { fetchBackendJson } from '$lib/server/backend/http.js'
import { fetchModuleDraftState } from '$lib/server/backend/module-details.js'
import { getFieldModifications } from '$lib/components/forms/module-draft-keys'
import { canEdit } from '$lib/schemas/module-draft'
import { error, redirect } from '@sveltejs/kit'
import { superValidate } from 'sveltekit-superforms'
import { zod4 } from 'sveltekit-superforms/adapters'
import type { LayoutServerLoad } from './$types.js'
import { z } from 'zod/v4'

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
  return superValidate({}, zod4(moduleFormSchema))
}

function createForm(
  module: ModuleProtocol,
  updatePermissions: string[],
  permittedAssessmentMethods: string[]
) {
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
      updatePermissions,
      firstExaminer: module.metadata.examiner.first,
      secondExaminer: module.metadata.examiner.second,
      examPhases: module.metadata.examPhases,
      assessmentMethods: module.metadata.assessmentMethods.mandatory,
      permittedAssessmentMethods,
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
    zod4(moduleFormSchema)
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
      form,
      mode,
      module: null,
      moduleDraftKeys: null,
      approvals: [],
      fieldStatuses: undefined,
      userWithUpdatePermissions: [],
      reviews: [],
      breadcrumbLabels: { [MY_MODULE_ROUTE_ID]: 'Neues Modul' }
    }
  }

  const isReview = mode === 'review'
  const state = await fetchModuleDraftState(fetch, params.id)

  if (!isReview && !canEdit(state)) {
    throw error(403, { message: 'Das Modul kann nicht bearbeitet werden.' })
  }

  const get = <Schema extends z.ZodType>(path: string, schema: Schema, message: string) =>
    fetchBackendJson(fetch, path, schema, message)
  /** Optional data falls back to an empty value if it cannot be loaded. */
  const orElse = <T>(promise: Promise<T>, fallback: T) => promise.catch(() => fallback)

  // requested in parallel, but a failed module is reported before failed assessment methods
  const permittedAssessmentMethodsReq = get(
    `/api/modules/${params.id}/assessmentMethods`,
    permittedAssessmentMethodsSchema,
    'Prüfungsformen konnten nicht geladen werden'
  )
  permittedAssessmentMethodsReq.catch(() => {})

  const [latest, moduleDraftKeys, approvals, userWithUpdatePermissions, reviewEntries] =
    await Promise.all([
      get(
        `/auth-api/modules/${params.id}/latest`,
        moduleProtocolSchema,
        'Modul konnte nicht geladen werden'
      ),
      orElse(get(`/auth-api/moduleDrafts/${params.id}/keys`, moduleDraftKeysSchema, ''), null),
      orElse(get(`/auth-api/moduleReviews/${params.id}`, z.array(approvalSchema), ''), []),
      orElse(
        get(`/auth-api/moduleUpdatePermissions/${params.id}`, updatePermissionsSchema, ''),
        []
      ),
      isReview
        ? orElse(get('/auth-api/moduleReviews', z.array(moduleReviewEntrySchema), ''), [])
        : []
    ])
  const permittedAssessmentMethods = await permittedAssessmentMethodsReq

  // the backend does not return the id of the module if a module draft exists
  const module = { ...latest, id: latest.id || params.id }
  const reviews = reviewEntries
    .filter((a) => a.moduleId === params.id && a.canReview)
    .map((a) => ({
      reviewId: a.reviewId,
      role: a.role.deLabel,
      studyProgram: a.studyProgram.deLabel
    }))

  const form = await createForm(module, userWithUpdatePermissions, permittedAssessmentMethods)
  const fieldStatuses = getFieldModifications(moduleDraftKeys)

  return {
    form,
    mode,
    module,
    moduleDraftKeys,
    approvals,
    fieldStatuses,
    reviews,
    breadcrumbLabels: { [MY_MODULE_ROUTE_ID]: module.metadata.title }
  }
}
