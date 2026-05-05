import { isParsed, type ModuleVersion } from '$lib/types/module-version'

export function downloadModuleVersion(version: ModuleVersion) {
  if (!isParsed(version)) return
}
