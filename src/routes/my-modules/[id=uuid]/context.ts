import type { ModuleForm } from '$lib/schemas/module'
import type { ModuleExamsUpdate } from '$lib/schemas/module-exams'
import { getContext, setContext } from 'svelte'
import type { SuperForm } from 'sveltekit-superforms'

export function setModuleFormContext(form: SuperForm<ModuleForm>) {
  setContext('moduleForm', form)
}

export function getModuleFormContext(): SuperForm<ModuleForm> {
  return getContext('moduleForm')
}

/** Initializes the lazily loaded exams of the live module as form data and saved state, unless already initialized. */
export type InitModuleExams = (exams: ModuleExamsUpdate) => void

export function setModuleExamsContext(init: InitModuleExams) {
  setContext('moduleExams', init)
}

export function getModuleExamsContext(): InitModuleExams {
  return getContext('moduleExams')
}
