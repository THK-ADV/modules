import type { StudyProgramFilterOption } from '$lib/components/study-program-filter'
import { toStudyProgramFilterOption } from '$lib/components/study-program-filter/options'
import { fmtPerson, fmtPersonShort, peopleOrdering } from '$lib/formats'
import type { Identity, Status } from '$lib/types/core'
import type { FilterData } from '$lib/types/filter-data'
import type { ModuleView } from '$lib/types/module'
import { getFullPOId, type StudyProgram } from '$lib/types/study-program'
import type { PaginationState } from '@tanstack/table-core'
import type { ModuleFilterShareState } from '$lib/settings/module-filter-share-url'
import {
  clearItemFromLocalStorage,
  getArrayFromLocalStorage,
  getPaginationFromLocalStorage,
  setArrayToLocalStorage,
  setPaginationToLocalStorage
} from './local-storage'
import { getModuleTypeOptions, getSemesterOptions } from './store.svelte'

function createModuleFilter() {
  // Bumps when any filter changes so TanStack re-runs `globalFilterFn`.
  let changed = $state(1)

  let studyPrograms = $state.raw(new Array<StudyProgramFilterOption>())
  let identities = $state.raw(new Array<FilterData>())
  let semester = $state.raw(new Array<FilterData>())
  let moduleTypes = $state.raw(new Array<FilterData>())
  let moduleStatus = $state.raw(new Array<FilterData>())

  let selectedStudyPrograms = $state(getArrayFromLocalStorage('mf-selected-study-programs'))
  let selectedIdentities = $state(getArrayFromLocalStorage('mf-selected-identities'))
  let selectedSemester = $state(getArrayFromLocalStorage('mf-selected-semester'))
  let selectedModuleTypes = $state(getArrayFromLocalStorage('mf-selected-module-types'))
  let selectedModuleStatus = $state(getArrayFromLocalStorage('mf-selected-module-status'))

  let title = $state('')
  let temporaryShareSession = $state(false)
  let initialShareState: ModuleFilterShareState | null = null

  const pages = ['15', '30', '45', 'Alle']
  let pagination = $state(getPaginationFromLocalStorage('mf-pagination', +pages[0]))

  function loadFromLocalStorage() {
    selectedStudyPrograms = getArrayFromLocalStorage('mf-selected-study-programs')
    selectedIdentities = getArrayFromLocalStorage('mf-selected-identities')
    selectedSemester = getArrayFromLocalStorage('mf-selected-semester')
    selectedModuleTypes = getArrayFromLocalStorage('mf-selected-module-types')
    selectedModuleStatus = getArrayFromLocalStorage('mf-selected-module-status')
    pagination = getPaginationFromLocalStorage('mf-pagination', +pages[0])
  }

  function setArraySelection(
    next: string[],
    persistKey: string,
    allowedValues: string[]
  ): string[] {
    const validValues = new Set(allowedValues)
    const sanitized = next
      .map((value) => value.trim())
      .filter((value, index, all) => value.length > 0 && all.indexOf(value) === index)
      .filter((value) => validValues.has(value))

    if (!temporaryShareSession) {
      setArrayToLocalStorage(persistKey, sanitized)
    }
    return sanitized
  }

  function hasAddedSelections(current: string[], initial: string[]) {
    return current.some((value) => !initial.includes(value))
  }

  function hasAddedFiltersSinceShareLoad() {
    if (!temporaryShareSession || initialShareState === null) {
      return false
    }

    return (
      hasAddedSelections(selectedStudyPrograms, initialShareState.selectedStudyPrograms) ||
      hasAddedSelections(selectedIdentities, initialShareState.selectedIdentities) ||
      hasAddedSelections(selectedSemester, initialShareState.selectedSemester) ||
      hasAddedSelections(selectedModuleTypes, initialShareState.selectedModuleTypes) ||
      hasAddedSelections(selectedModuleStatus, initialShareState.selectedModuleStatus) ||
      (title.trim().length > 0 && title.trim() !== initialShareState.title)
    )
  }

  return {
    get title() {
      return title
    },
    get studyPrograms() {
      return studyPrograms
    },
    get identities() {
      return identities
    },
    get semester() {
      return semester
    },
    get moduleTypes() {
      return moduleTypes
    },
    get moduleStatus() {
      return moduleStatus
    },
    get selectedStudyPrograms() {
      return selectedStudyPrograms
    },
    get selectedIdentities() {
      return selectedIdentities
    },
    get selectedSemester() {
      return selectedSemester
    },
    get selectedModuleTypes() {
      return selectedModuleTypes
    },
    get selectedModuleStatus() {
      return selectedModuleStatus
    },
    get pagination() {
      return pagination
    },
    get pages() {
      return pages
    },
    get changed() {
      return changed
    },
    get temporaryShareSession() {
      return temporaryShareSession
    },
    get shareState(): ModuleFilterShareState {
      return {
        selectedStudyPrograms: [...selectedStudyPrograms],
        selectedIdentities: [...selectedIdentities],
        selectedSemester: [...selectedSemester],
        selectedModuleTypes: [...selectedModuleTypes],
        selectedModuleStatus: [...selectedModuleStatus],
        title
      }
    },
    get resetButtonLabel() {
      if (temporaryShareSession && !hasAddedFiltersSinceShareLoad()) {
        return 'Geteilte Filter zurücksetzen'
      }
      return 'Alle Filter zurücksetzen'
    },
    set pagination(value: PaginationState) {
      pagination = value
      if (!temporaryShareSession) {
        setPaginationToLocalStorage('mf-pagination', value)
      }
    },
    set title(value: string) {
      title = value
      changed++
    },
    selectStudyProgram(id: string) {
      if (selectedStudyPrograms.includes(id)) {
        selectedStudyPrograms = selectedStudyPrograms.filter((x) => x !== id)
      } else {
        selectedStudyPrograms.push(id)
      }
      if (!temporaryShareSession) {
        setArrayToLocalStorage('mf-selected-study-programs', selectedStudyPrograms)
      }
      changed++
    },
    selectSemester(id: string) {
      if (selectedSemester.includes(id)) {
        selectedSemester = selectedSemester.filter((x) => x !== id)
      } else {
        selectedSemester.push(id)
      }
      if (!temporaryShareSession) {
        setArrayToLocalStorage('mf-selected-semester', selectedSemester)
      }
      changed++
    },
    selectIdentity(id: string) {
      if (selectedIdentities.includes(id)) {
        selectedIdentities = selectedIdentities.filter((x) => x !== id)
      } else {
        selectedIdentities.push(id)
      }
      if (!temporaryShareSession) {
        setArrayToLocalStorage('mf-selected-identities', selectedIdentities)
      }
      changed++
    },
    selectModuleType(id: string) {
      if (selectedModuleTypes.includes(id)) {
        selectedModuleTypes = selectedModuleTypes.filter((x) => x !== id)
      } else {
        selectedModuleTypes.push(id)
      }
      if (!temporaryShareSession) {
        setArrayToLocalStorage('mf-selected-module-types', selectedModuleTypes)
      }
      changed++
    },
    selectModuleStatus(id: string) {
      if (selectedModuleStatus.includes(id)) {
        selectedModuleStatus = selectedModuleStatus.filter((x) => x !== id)
      } else {
        selectedModuleStatus.push(id)
      }
      if (!temporaryShareSession) {
        setArrayToLocalStorage('mf-selected-module-status', selectedModuleStatus)
      }
      changed++
    },
    clearSelectedStudyPrograms() {
      selectedStudyPrograms = []
      if (!temporaryShareSession) {
        clearItemFromLocalStorage('mf-selected-study-programs')
      }
      changed++
    },
    clearSelectedIdentities() {
      selectedIdentities = []
      if (!temporaryShareSession) {
        clearItemFromLocalStorage('mf-selected-identities')
      }
      changed++
    },
    clearSelectedSemester() {
      selectedSemester = []
      if (!temporaryShareSession) {
        clearItemFromLocalStorage('mf-selected-semester')
      }
      changed++
    },
    clearSelectedModuleTypes() {
      selectedModuleTypes = []
      if (!temporaryShareSession) {
        clearItemFromLocalStorage('mf-selected-module-types')
      }
      changed++
    },
    clearSelectedModuleStatus() {
      selectedModuleStatus = []
      if (!temporaryShareSession) {
        clearItemFromLocalStorage('mf-selected-module-status')
      }
      changed++
    },
    clearSelections() {
      this.clearSelectedStudyPrograms()
      this.clearSelectedIdentities()
      this.clearSelectedSemester()
      this.clearSelectedModuleTypes()
      this.clearSelectedModuleStatus()
      title = ''
    },
    setTemporaryShareSession(enabled: boolean) {
      if (temporaryShareSession === enabled) {
        return
      }
      temporaryShareSession = enabled
      if (!temporaryShareSession) {
        initialShareState = null
        loadFromLocalStorage()
        title = ''
      }
      changed++
    },
    applyShareState(state: ModuleFilterShareState) {
      selectedStudyPrograms = setArraySelection(
        state.selectedStudyPrograms,
        'mf-selected-study-programs',
        studyPrograms.map((option) => option.id)
      )
      selectedIdentities = setArraySelection(
        state.selectedIdentities,
        'mf-selected-identities',
        identities.map((option) => option.id)
      )
      selectedSemester = setArraySelection(
        state.selectedSemester,
        'mf-selected-semester',
        semester.map((option) => option.id)
      )
      selectedModuleTypes = setArraySelection(
        state.selectedModuleTypes,
        'mf-selected-module-types',
        moduleTypes.map((option) => option.id)
      )
      selectedModuleStatus = setArraySelection(
        state.selectedModuleStatus,
        'mf-selected-module-status',
        moduleStatus.map((option) => option.id)
      )
      title = state.title.trim()
      initialShareState = {
        selectedStudyPrograms: [...selectedStudyPrograms],
        selectedIdentities: [...selectedIdentities],
        selectedSemester: [...selectedSemester],
        selectedModuleTypes: [...selectedModuleTypes],
        selectedModuleStatus: [...selectedModuleStatus],
        title
      }
      pagination = { ...pagination, pageIndex: 0 }
      changed++
    },
    async init(fetch: typeof globalThis.fetch) {
      if (semester.length === 0) {
        semester = getSemesterOptions()
      }
      if (moduleTypes.length === 0) {
        moduleTypes = getModuleTypeOptions()
      }
      if (studyPrograms.length === 0 || identities.length === 0 || moduleStatus.length === 0) {
        const [sp, id, st] = await Promise.allSettled([
          fetch('/api/studyPrograms?filter=currently-active'),
          fetch('/api/identities'),
          fetch('/api/status')
        ])
        if (sp.status === 'fulfilled' && sp.value.ok) {
          const xs: StudyProgram[] = await sp.value.json()
          studyPrograms = xs.map((sp) => toStudyProgramFilterOption(sp))
        }
        if (id.status === 'fulfilled' && id.value.ok) {
          const xs: Identity[] = await id.value.json()
          xs.sort(peopleOrdering)
          identities = xs.map((id) => ({
            label: fmtPerson(id),
            id: id.id,
            badge: fmtPersonShort(id)
          }))
        }
        if (st.status === 'fulfilled' && st.value.ok) {
          const xs: Status[] = await st.value.json()
          moduleStatus = xs.map((s) => ({
            label: s.deLabel,
            id: s.id,
            badge: s.deLabel
          }))
        }
      }
    }
  }
}

export const moduleFilter = createModuleFilter()

export function showModuleTableRow(m: ModuleView): boolean {
  const q = moduleFilter.title.trim().toLowerCase()
  if (q && !m.title.toLowerCase().includes(q) && !m.abbrev.toLowerCase().includes(q)) {
    return false
  }

  const people = moduleFilter.selectedIdentities
  if (people.length > 0 && !m.moduleManagement.some(({ id }) => people.includes(id))) {
    return false
  }

  const status = moduleFilter.selectedModuleStatus
  if (status.length > 0 && !status.includes(m.status)) {
    return false
  }

  const programs = moduleFilter.selectedStudyPrograms
  const semesters = moduleFilter.selectedSemester
  const types = moduleFilter.selectedModuleTypes

  const semesterMatches = (recommendedSemester: number[]) =>
    recommendedSemester.some((s) => semesters.some((id) => +id === s))

  const relevantAssociations = m.studyProgram.filter((assoc) => {
    if (programs.length > 0 && !programs.includes(getFullPOId(assoc.studyProgram))) {
      return false
    }
    if (semesters.length > 0 && !semesterMatches(assoc.recommendedSemester)) {
      return false
    }
    return true
  })

  if ((programs.length > 0 || semesters.length > 0) && relevantAssociations.length === 0) {
    return false
  }

  if (types.length === 1) {
    const only = types[0]
    if (programs.length > 0) {
      const matchesAssociationType = relevantAssociations.some((assoc) => {
        if (only === 'pm') return assoc.mandatory === true
        if (only === 'wm') return assoc.mandatory === false
        return true
      })
      if (!matchesAssociationType) {
        return false
      }
    } else {
      const mt = m.moduleType
      if (mt === undefined) return false
      if (mt.id !== only && mt.id !== 'pwm') return false
    }
  }

  return true
}
