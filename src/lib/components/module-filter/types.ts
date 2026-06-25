import { fmtManagement } from '$lib/formats'
import type { ModuleCore } from '$lib/types/core'

export interface ModuleFilterOption {
  id: string
  label: string
  abbreviation: string
  ectsLabel: string
  managementLabel: string
  searchText: string
}

function createSearchText(parts: string[]): string {
  return parts
    .map((part) => part.trim().toLocaleLowerCase('de-DE'))
    .filter((part) => part.length > 0)
    .join(' ')
}

function createManagementLabel(people: string[]): string {
  if (people.length === 0) return ''

  const visible = people.slice(0, 2)
  const overflow = people.length - visible.length
  return overflow > 0 ? `${visible.join(', ')} +${overflow}` : visible.join(', ')
}

function toModuleFilterOption(
  module: ModuleCore,
  ectsFormatter: Intl.NumberFormat
): ModuleFilterOption {
  const managementPeople = module.moduleManagement.map(fmtManagement).filter(Boolean)
  const managementLabel = createManagementLabel(managementPeople)
  const ectsLabel = `${ectsFormatter.format(module.ects)} ECTS`

  return {
    id: module.id,
    label: module.title,
    abbreviation: module.abbreviation,
    ectsLabel,
    managementLabel,
    searchText: createSearchText([module.title, module.abbreviation, ...managementPeople])
  }
}

export function createModuleFilterOptions(modules: ModuleCore[]): ModuleFilterOption[] {
  const ectsFormatter = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 })
  return modules.map((module) => toModuleFilterOption(module, ectsFormatter))
}
