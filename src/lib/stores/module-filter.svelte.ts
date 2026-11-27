import { browser } from '$app/environment'
import type { StudyProgramFilterOption } from '$lib/components/study-program-filter'
import { toStudyProgramFilterOption } from '$lib/components/study-program-filter/options'
import type { FilterData } from '$lib/components/filter-option.svelte'
import type { ModuleView } from '$lib/schemas/module-view'
import { getFullPOId } from '$lib/schemas/study-program'
import type { PaginationState } from '@tanstack/table-core'
import { getShareList, type FilterShareParams } from '$lib/components/filter-share'
import {
  clearItemFromLocalStorage,
  getArrayFromLocalStorage,
  getPaginationFromLocalStorage,
  setArrayToLocalStorage,
  setPaginationToLocalStorage
} from './local-storage'
import { getModuleFilterOptions } from './filter-options.remote'
import { getModuleTypeOptions, getSemesterOptions } from './store.svelte'

function createModuleFilter() {
  // Bumps when any filter changes so TanStack re-runs `globalFilterFn`.
  let changed = $state(1)

  let studyPrograms = $state.raw(new Array<StudyProgramFilterOption>())
  let identities = $state.raw(new Array<FilterData>())
  const semester = getSemesterOptions()
  const moduleTypes = getModuleTypeOptions()
  let moduleStatus = $state.raw(new Array<FilterData>())
  // a retry refreshes, since the browser may still cache the earlier, incomplete result
  let retry = false

  let selectedStudyPrograms = $state(getArrayFromLocalStorage('mf-selected-study-programs'))
  let selectedIdentities = $state(getArrayFromLocalStorage('mf-selected-identities'))
  let selectedSemester = $state(getArrayFromLocalStorage('mf-selected-semester'))
  let selectedModuleTypes = $state(getArrayFromLocalStorage('mf-selected-module-types'))
  let selectedModuleStatus = $state(getArrayFromLocalStorage('mf-selected-module-status'))

  let title = $state('')
  // A shared link shows its filters without overwriting the viewer's own in local storage.
  let shared = $state(false)

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

  function shareParams(): FilterShareParams {
    return {
      sp: selectedStudyPrograms,
      sem: selectedSemester,
      id: selectedIdentities,
      mt: selectedModuleTypes,
      st: selectedModuleStatus,
      q: title
    }
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
    get shared() {
      return shared
    },
    get shareParams() {
      return shareParams()
    },
    set pagination(value: PaginationState) {
      pagination = value
      if (!shared) {
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
      if (!shared) {
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
      if (!shared) {
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
      if (!shared) {
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
      if (!shared) {
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
      if (!shared) {
        setArrayToLocalStorage('mf-selected-module-status', selectedModuleStatus)
      }
      changed++
    },
    clearSelectedStudyPrograms() {
      selectedStudyPrograms = []
      if (!shared) {
        clearItemFromLocalStorage('mf-selected-study-programs')
      }
      changed++
    },
    clearSelectedIdentities() {
      selectedIdentities = []
      if (!shared) {
        clearItemFromLocalStorage('mf-selected-identities')
      }
      changed++
    },
    clearSelectedSemester() {
      selectedSemester = []
      if (!shared) {
        clearItemFromLocalStorage('mf-selected-semester')
      }
      changed++
    },
    clearSelectedModuleTypes() {
      selectedModuleTypes = []
      if (!shared) {
        clearItemFromLocalStorage('mf-selected-module-types')
      }
      changed++
    },
    clearSelectedModuleStatus() {
      selectedModuleStatus = []
      if (!shared) {
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
    applyShare(params: URLSearchParams | null) {
      if (!params) {
        if (shared) {
          shared = false
          loadFromLocalStorage()
          title = ''
          changed++
        }
        return
      }
      shared = true
      selectedStudyPrograms = getShareList(params, 'sp')
      selectedSemester = getShareList(params, 'sem')
      selectedIdentities = getShareList(params, 'id')
      selectedModuleTypes = getShareList(params, 'mt')
      selectedModuleStatus = getShareList(params, 'st')
      title = params.get('q')?.trim() ?? ''
      pagination = { ...pagination, pageIndex: 0 }
      changed++
    },
    /**
     * Loads the options in the page load, so they are ready on first use and hydrate from the
     * server render. The browser keeps complete options; on the server they stay request-local.
     */
    async init() {
      if (studyPrograms.length && identities.length && moduleStatus.length) return
      const query = getModuleFilterOptions()
      if (retry) void query.refresh()
      retry = browser
      const options = await query.catch(() => null)
      if (!browser || !options) return
      studyPrograms = options.studyPrograms.map(toStudyProgramFilterOption)
      identities = options.identities
      moduleStatus = options.moduleStatus
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
