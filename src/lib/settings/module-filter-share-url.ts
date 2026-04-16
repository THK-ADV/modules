export type ModuleFilterShareState = {
  selectedStudyPrograms: string[]
  selectedSemester: string[]
  selectedIdentities: string[]
  selectedModuleTypes: string[]
  selectedModuleStatus: string[]
  title: string
}

export const MODULE_FILTER_SHARE_PARAM_KEYS = {
  studyPrograms: 'sp',
  semester: 'sem',
  identities: 'id',
  moduleTypes: 'mt',
  moduleStatus: 'st',
  title: 'q'
} as const

function encodeCsv(values: string[]): string | null {
  const cleaned = values.map((value) => value.trim()).filter((value) => value.length > 0)
  if (cleaned.length === 0) {
    return null
  }
  return cleaned.join(',')
}

function decodeCsv(value: string | null): string[] {
  if (!value) {
    return []
  }
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
}

export function hasModuleFilterShareParams(searchParams: URLSearchParams): boolean {
  const keys = Object.values(MODULE_FILTER_SHARE_PARAM_KEYS)
  return keys.some((key) => searchParams.has(key))
}

export function parseModuleFilterShareState(searchParams: URLSearchParams): ModuleFilterShareState {
  const keys = MODULE_FILTER_SHARE_PARAM_KEYS
  return {
    selectedStudyPrograms: decodeCsv(searchParams.get(keys.studyPrograms)),
    selectedSemester: decodeCsv(searchParams.get(keys.semester)),
    selectedIdentities: decodeCsv(searchParams.get(keys.identities)),
    selectedModuleTypes: decodeCsv(searchParams.get(keys.moduleTypes)),
    selectedModuleStatus: decodeCsv(searchParams.get(keys.moduleStatus)),
    title: (searchParams.get(keys.title) ?? '').trim()
  }
}

export function applyModuleFilterShareStateToSearchParams(
  searchParams: URLSearchParams,
  state: ModuleFilterShareState
) {
  const keys = MODULE_FILTER_SHARE_PARAM_KEYS
  const mappings: Array<[key: string, value: string | null]> = [
    [keys.studyPrograms, encodeCsv(state.selectedStudyPrograms)],
    [keys.semester, encodeCsv(state.selectedSemester)],
    [keys.identities, encodeCsv(state.selectedIdentities)],
    [keys.moduleTypes, encodeCsv(state.selectedModuleTypes)],
    [keys.moduleStatus, encodeCsv(state.selectedModuleStatus)],
    [keys.title, state.title.trim().length > 0 ? state.title.trim() : null]
  ]

  for (const [key, value] of mappings) {
    if (value === null) {
      searchParams.delete(key)
    } else {
      searchParams.set(key, value)
    }
  }
}

export function clearModuleFilterShareParams(searchParams: URLSearchParams) {
  for (const key of Object.values(MODULE_FILTER_SHARE_PARAM_KEYS)) {
    searchParams.delete(key)
  }
}
