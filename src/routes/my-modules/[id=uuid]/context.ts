import type { ModuleForm } from '$lib/schemas/module'
import { getContext, setContext } from 'svelte'
import type { SuperForm } from 'sveltekit-superforms'

export function setModuleFormContext(form: SuperForm<ModuleForm>) {
  setContext('moduleForm', form)
}
export function getModuleFormContext(): SuperForm<ModuleForm> {
  return getContext('moduleForm')
}
