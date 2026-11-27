import { isParsed, type ModuleVersion } from '$lib/schemas/module-version'

export function downloadModuleVersion(version: ModuleVersion) {
  if (!isParsed(version)) return
}
