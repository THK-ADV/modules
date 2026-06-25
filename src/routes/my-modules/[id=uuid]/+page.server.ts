import { moduleFormSchema, type ModuleForm } from '$lib/schemas/module.js'
import type { ModuleProtocol } from '$lib/types/module-protocol.js'
import { fail } from '@sveltejs/kit'
import { superValidate, type SuperValidated } from 'sveltekit-superforms'
import { zod4 } from 'sveltekit-superforms/adapters'
import type { Actions } from './$types.js'
import { fetchBackend, fetchBackendJson } from '$lib/server/backend/http.js'
import { z } from 'zod/v4'

type ModuleProtocolUpdate = Omit<ModuleProtocol, 'id'>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function errorMessage(err: any): string {
  switch (err.tag) {
    case 'parsing-error':
      return `Parsing error: expected ${err.expected}, found ${err.found}`
    case 'printing-error':
      return `Printing error: expected ${err.expected}, found ${err.found}`
    case 'validation-error':
      return `Validation error: ${err.error.errs.join(', ')}`
    default:
      return JSON.stringify(err)
  }
}

function createModuleProtocol(form: SuperValidated<ModuleForm>): ModuleProtocolUpdate {
  return {
    metadata: {
      title: form.data.title,
      abbrev: form.data.abbrev,
      moduleType: form.data.moduleType,
      ects: form.data.ects,
      language: form.data.language,
      duration: form.data.duration,
      season: form.data.season,
      workload: form.data.workload,
      status: form.data.status,
      location: form.data.location,
      participants: form.data.participants,
      moduleRelation: form.data.moduleRelation,
      moduleManagement: form.data.management,
      lecturers: form.data.lecturers,
      assessmentMethods: {
        mandatory: form.data.assessmentMethods
      },
      examiner: { first: form.data.firstExaminer, second: form.data.secondExaminer },
      examPhases: form.data.examPhases,
      prerequisites: {
        recommended: form.data.recommendedPrerequisites,
        required: form.data.requiredPrerequisites
      },
      po: form.data.po,
      taughtWith: form.data.taughtWith || [],
      attendanceRequirement: form.data.attendanceRequirement,
      assessmentPrerequisite: form.data.assessmentPrerequisite
    },
    deContent: form.data.deContent,
    enContent: form.data.enContent
  }
}

function updateModule(fetch: typeof globalThis.fetch, protocol: ModuleProtocolUpdate, id: string) {
  return fetch(`/auth-api/moduleDrafts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(protocol),
    headers: {
      'Content-Type': 'application/json',
      'Mocogi-Version-Scheme': 'v1.0s'
    }
  })
}

function createModule(fetch: typeof globalThis.fetch, protocol: ModuleProtocolUpdate) {
  return fetchBackendJson(
    fetch,
    '/auth-api/moduleDrafts',
    z.object({ id: z.uuid() }),
    'Fehler beim Erstellen des Moduls',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Mocogi-Version-Scheme': 'v1.0s'
      },
      body: JSON.stringify(protocol)
    }
  )
}

function updateModulePermissions(
  fetch: typeof globalThis.fetch,
  permissions: string[],
  moduleId: string
) {
  return fetchBackend(
    fetch,
    `/auth-api/moduleUpdatePermissions/${moduleId}`,
    'Fehler beim Aktualisieren der Modul-Zugriffsrechte',
    {
      method: 'POST',
      body: JSON.stringify(permissions),
      headers: { 'Content-Type': 'application/json' }
    }
  )
}

function updateModulePermittedAssessmentMethods(
  fetch: typeof globalThis.fetch,
  assessmentMethods: string[],
  moduleId: string
) {
  return fetchBackend(
    fetch,
    `/auth-api/modules/${moduleId}/assessmentMethods`,
    'Fehler beim Aktualisieren der zulässigen Prüfungsformen',
    {
      method: 'PUT',
      body: JSON.stringify(assessmentMethods),
      headers: { 'Content-Type': 'application/json' }
    }
  )
}

export const actions: Actions = {
  default: async ({ request, params, fetch, url }) => {
    const form = await superValidate(request, zod4(moduleFormSchema))
    const mode = url.searchParams.get('mode')

    if (!form.valid || !mode) {
      return fail(400, { form })
    }

    const protocol = createModuleProtocol(form)

    if (mode === 'create') {
      const { id } = await createModule(fetch, protocol)
      const [up, amr] = await Promise.all([
        updateModulePermissions(fetch, form.data.updatePermissions, id),
        updateModulePermittedAssessmentMethods(fetch, form.data.permittedAssessmentMethods, id)
      ])
      if (!up.ok || !amr.ok) {
        const err1 = await up
          .json()
          .then((json) => errorMessage(json))
          .catch(() => 'Fehler beim Aktualisieren der Modul-Zugriffsrechte')
        const err2 = await amr
          .json()
          .then((json) => errorMessage(json))
          .catch(() => 'Fehler beim Aktualisieren der zulässigen Prüfungsformen')
        return fail(400, { form, message: err1 || err2 })
      }
      return { form }
    } else {
      const [mr, pr, amr] = await Promise.all([
        updateModule(fetch, protocol, params.id),
        updateModulePermissions(fetch, form.data.updatePermissions, params.id),
        updateModulePermittedAssessmentMethods(
          fetch,
          form.data.permittedAssessmentMethods,
          params.id
        )
      ])

      if (!mr.ok || !pr.ok || !amr.ok) {
        const err1 = await mr
          .json()
          .then((json) => errorMessage(json))
          .catch(() => null)
        const err2 = await pr
          .json()
          .then((json) => errorMessage(json))
          .catch(() => null)
        const err3 = await amr
          .json()
          .then((json) => errorMessage(json))
          .catch(() => null)
        return fail(400, {
          form,
          message: err1 || err2 || err3 || 'Fehler beim Aktualisieren des Moduls'
        })
      }
      return { form }
    }
  }
}
