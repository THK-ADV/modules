import { moduleSchema } from '$lib/schemas/module.js'
import type {
  AssessmentEntry,
  MetadataProtocol,
  ModuleProtocol,
  PrerequisiteEntry
} from '$lib/types/module-protocol.js'
import { fail } from '@sveltejs/kit'
import { zod } from 'sveltekit-superforms/adapters'
import { superValidate } from 'sveltekit-superforms/server'
import type { Actions } from './$types.js'

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

// TODO: remove unnecessary fields if the backend is updated

interface MetadataProtocolUpdate
  extends Omit<MetadataProtocol, 'assessmentMethods' | 'prerequisites'> {
  assessmentMethods: {
    mandatory: AssessmentEntry[]
    optional: []
  }
  globalCriteria: []
  competences: []
  prerequisites: {
    recommended: (PrerequisiteEntry & { pos: [] }) | null
    required: (PrerequisiteEntry & { pos: [] }) | null
  }
}

interface ModuleProtocolUpdate extends Omit<ModuleProtocol, 'id' | 'metadata'> {
  metadata: MetadataProtocolUpdate
}

export const actions: Actions = {
  default: async ({ request, params, fetch }) => {
    const form = await superValidate(request, zod(moduleSchema))

    if (!form.valid) {
      return fail(400, { form })
    }

    const protocol: ModuleProtocolUpdate = {
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
          mandatory: form.data.assessmentMethods,
          optional: []
        },
        examiner: { first: form.data.firstExaminer, second: form.data.secondExaminer },
        examPhases: form.data.examPhases,
        globalCriteria: [],
        competences: [],
        prerequisites: {
          recommended: form.data.recommendedPrerequisites
            ? { ...form.data.recommendedPrerequisites, pos: [] }
            : null,
          required: form.data.requiredPrerequisites
            ? { ...form.data.requiredPrerequisites, pos: [] }
            : null
        },
        po: form.data.po,
        taughtWith: form.data.taughtWith || [],
        attendanceRequirement: form.data.attendanceRequirement,
        assessmentPrerequisite: form.data.assessmentPrerequisite
      },
      deContent: form.data.deContent,
      enContent: form.data.enContent
    }

    const moduleUpdateReq = await fetch(`/api/moduleDrafts/${params.id}`, {
      method: 'PUT',
      body: JSON.stringify(protocol),
      headers: {
        'Content-Type': 'application/json',
        'Mocogi-Version-Scheme': 'v1.0s'
      }
    })

    const moduleUpdatePermissionsReq = await fetch(
      `/api/moduleUpdatePermissions/${params.id}?newApi=true`,
      {
        method: 'POST',
        body: JSON.stringify(form.data.updatePermissions),
        headers: { 'Content-Type': 'application/json' }
      }
    )

    const [moduleUpdateResp, moduleUpdatePermissionsResp] = await Promise.all([
      moduleUpdateReq,
      moduleUpdatePermissionsReq
    ])

    if (!moduleUpdateResp.ok || !moduleUpdatePermissionsResp.ok) {
      try {
        const err1 = await moduleUpdateResp
          .json()
          .then((json) => errorMessage(json))
          .catch(() => null)
        const err2 = await moduleUpdatePermissionsResp
          .json()
          .then((json) => errorMessage(json))
          .catch(() => null)
        return fail(400, {
          form,
          message: err1 || err2 || 'Failed to update module'
        })
      } catch (err) {
        console.error(err)
        return fail(400, {
          form,
          message: 'Failed to update module'
        })
      }
    }

    return { form }
  }
}
