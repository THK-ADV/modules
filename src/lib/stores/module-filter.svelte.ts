import type { StudyProgramFilterOption } from '$lib/components/study-program-filter'
import { toStudyProgramFilterOptions } from '$lib/components/study-program-filter'
import { fmtPerson, fmtPersonShort, peopleOrdering } from '$lib/formats'
import type { Identity, Status } from '$lib/types/core'
import type { FilterData } from '$lib/types/filter-data'
import type { ModuleView } from '$lib/types/module'
import { getFullPOId, type StudyProgram } from '$lib/types/study-program'
import type { PaginationState } from '@tanstack/table-core'
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

  const pages = ['15', '30', '45', 'Alle']
  let pagination = $state(getPaginationFromLocalStorage('mf-pagination', +pages[0]))

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
    set pagination(value: PaginationState) {
      pagination = value
      setPaginationToLocalStorage('mf-pagination', value)
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
      setArrayToLocalStorage('mf-selected-study-programs', selectedStudyPrograms)
      changed++
    },
    selectSemester(id: string) {
      if (selectedSemester.includes(id)) {
        selectedSemester = selectedSemester.filter((x) => x !== id)
      } else {
        selectedSemester.push(id)
      }
      setArrayToLocalStorage('mf-selected-semester', selectedSemester)
      changed++
    },
    selectIdentity(id: string) {
      if (selectedIdentities.includes(id)) {
        selectedIdentities = selectedIdentities.filter((x) => x !== id)
      } else {
        selectedIdentities.push(id)
      }
      setArrayToLocalStorage('mf-selected-identities', selectedIdentities)
      changed++
    },
    selectModuleType(id: string) {
      if (selectedModuleTypes.includes(id)) {
        selectedModuleTypes = selectedModuleTypes.filter((x) => x !== id)
      } else {
        selectedModuleTypes.push(id)
      }
      setArrayToLocalStorage('mf-selected-module-types', selectedModuleTypes)
      changed++
    },
    selectModuleStatus(id: string) {
      if (selectedModuleStatus.includes(id)) {
        selectedModuleStatus = selectedModuleStatus.filter((x) => x !== id)
      } else {
        selectedModuleStatus.push(id)
      }
      setArrayToLocalStorage('mf-selected-module-status', selectedModuleStatus)
      changed++
    },
    clearSelectedStudyPrograms() {
      selectedStudyPrograms = []
      clearItemFromLocalStorage('mf-selected-study-programs')
      changed++
    },
    clearSelectedIdentities() {
      selectedIdentities = []
      clearItemFromLocalStorage('mf-selected-identities')
      changed++
    },
    clearSelectedSemester() {
      selectedSemester = []
      clearItemFromLocalStorage('mf-selected-semester')
      changed++
    },
    clearSelectedModuleTypes() {
      selectedModuleTypes = []
      clearItemFromLocalStorage('mf-selected-module-types')
      changed++
    },
    clearSelectedModuleStatus() {
      selectedModuleStatus = []
      clearItemFromLocalStorage('mf-selected-module-status')
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
          studyPrograms = toStudyProgramFilterOptions(xs)
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
