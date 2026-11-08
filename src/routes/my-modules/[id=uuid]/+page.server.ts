import { moduleDraftSchema, type ModuleDraft } from '$lib/schemas/module.js'
import type { ModuleProtocol } from '$lib/types/module-protocol.js'
import { fail } from '@sveltejs/kit'
import { superValidate, type SuperValidated } from 'sveltekit-superforms'
import { zod4 } from 'sveltekit-superforms/adapters'
import type { Actions } from './$types.js'
import { fetchBackendJson } from '$lib/server/backend/http.js'
import { z } from 'zod/v4'

type ModuleProtocolUpdate = Omit<ModuleProtocol, 'id'>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function errorMessage(err: any): string {
  switch (err.tag) {
    case 'parsing-error':
      return `Parsing error: expected ${err.error.expected}, found ${err.error.found}`
    case 'printing-error':
      return `Printing error: expected ${err.error.expected}, found ${err.error.found}`
    case 'validation-error':
      return `Validation error: ${err.error.errs.join(', ')}`
    default:
      return JSON.stringify(err)
  }
}

function createModuleProtocol(form: SuperValidated<ModuleDraft>): ModuleProtocolUpdate {
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

export const actions: Actions = {
  default: async ({ request, params, fetch, url }) => {
    const form = await superValidate(request, zod4(moduleDraftSchema))
    const mode = url.searchParams.get('mode')

    if (!form.valid || !mode) {
      return fail(400, { form })
    }

    const protocol = createModuleProtocol(form)

    if (mode === 'create') {
      const { id } = await createModule(fetch, protocol)
      return { form, id }
    }
    const resp = await updateModule(fetch, protocol, params.id)
    if (!resp.ok) {
      const message = await resp
        .json()
        .then((json) => errorMessage(json))
        .catch(() => 'Fehler beim Aktualisieren des Moduls')
      return fail(400, { form, message })
    }
    return { form }
  }
}
