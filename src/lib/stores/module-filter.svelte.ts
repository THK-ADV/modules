import {
  fmtStudyProgram,
  fmtStudyProgramShort,
  peopleOrdering,
  fmtPerson,
  fmtPersonShort
} from '$lib/formats'
import type { Identity } from '$lib/types/core'
import type { FilterData } from '$lib/types/filter-data'
import type { StudyProgram } from '$lib/types/study-program'
import type { PaginationState } from '@tanstack/table-core'
import { getSemesterOptions, getModuleTypeOptions } from './store.svelte'
import {
  clearItemFromLocalStorage,
  getArrayFromLocalStorage,
  setArrayToLocalStorage
} from './local-storage'
import { browser } from '$app/environment'

function getPaginationFromLocalStorage(pageSize: number): PaginationState {
  if (!browser) {
    return { pageIndex: 0, pageSize: pageSize }
  }
  const value = localStorage.getItem('mf-pagination')
  if (value) {
    const [pageIndex, pageSize] = value.split(',')
    return { pageIndex: +pageIndex, pageSize: +pageSize }
  }
  return { pageIndex: 0, pageSize: pageSize }
}

function setPaginationToLocalStorage({ pageIndex, pageSize }: PaginationState) {
  if (!browser) {
    return
  }
  localStorage.setItem('mf-pagination', `${pageIndex},${pageSize}`)
}

function createModuleFilter() {
  let studyPrograms = $state.raw(new Array<FilterData>())
  let identities = $state.raw(new Array<FilterData>())
  let semester = $state.raw(new Array<FilterData>())
  let moduleTypes = $state.raw(new Array<FilterData>())

  let selectedStudyPrograms = $state(getArrayFromLocalStorage('mf-selected-study-programs'))
  let selectedIdentities = $state(getArrayFromLocalStorage('mf-selected-identities'))
  let selectedSemester = $state(getArrayFromLocalStorage('mf-selected-semester'))
  let selectedModuleTypes = $state(getArrayFromLocalStorage('mf-selected-module-types'))

  let title = $state('')

  const pages = ['15', '30', '45', 'Alle']
  let pagination = $state(getPaginationFromLocalStorage(+pages[0]))

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
    get pagination() {
      return pagination
    },
    get pages() {
      return pages
    },
    set pagination(value: PaginationState) {
      pagination = value
      setPaginationToLocalStorage(value)
    },
    set title(value: string) {
      title = value
    },
    selectStudyProgram(id: string) {
      if (selectedStudyPrograms.includes(id)) {
        selectedStudyPrograms = selectedStudyPrograms.filter((x) => x !== id)
      } else {
        selectedStudyPrograms.push(id)
      }
      setArrayToLocalStorage('mf-selected-study-programs', selectedStudyPrograms)
    },
    selectSemester(id: string) {
      if (selectedSemester.includes(id)) {
        selectedSemester = selectedSemester.filter((x) => x !== id)
      } else {
        selectedSemester.push(id)
      }
      setArrayToLocalStorage('mf-selected-semester', selectedSemester)
    },
    selectIdentity(id: string) {
      if (selectedIdentities.includes(id)) {
        selectedIdentities = selectedIdentities.filter((x) => x !== id)
      } else {
        selectedIdentities.push(id)
      }
      setArrayToLocalStorage('mf-selected-identities', selectedIdentities)
    },
    selectModuleType(id: string) {
      if (selectedModuleTypes.includes(id)) {
        selectedModuleTypes = selectedModuleTypes.filter((x) => x !== id)
      } else {
        selectedModuleTypes.push(id)
      }
      setArrayToLocalStorage('mf-selected-module-types', selectedModuleTypes)
    },
    clearSelectedStudyPrograms() {
      selectedStudyPrograms = []
      clearItemFromLocalStorage('mf-selected-study-programs')
    },
    clearSelectedIdentities() {
      selectedIdentities = []
      clearItemFromLocalStorage('mf-selected-identities')
    },
    clearSelectedSemester() {
      selectedSemester = []
      clearItemFromLocalStorage('mf-selected-semester')
    },
    clearSelectedModuleTypes() {
      selectedModuleTypes = []
      clearItemFromLocalStorage('mf-selected-module-types')
    },
    clearSelections() {
      this.clearSelectedStudyPrograms()
      this.clearSelectedIdentities()
      this.clearSelectedSemester()
      this.clearSelectedModuleTypes()
      title = ''
    },
    async init(fetch: typeof globalThis.fetch) {
      if (semester.length === 0) {
        semester = getSemesterOptions()
      }
      if (moduleTypes.length === 0) {
        moduleTypes = getModuleTypeOptions()
      }
      if (studyPrograms.length === 0 || identities.length === 0) {
        const [sp, id] = await Promise.allSettled([
          fetch('/api/studyPrograms?filter=currently-active'),
          fetch('/api/identities')
        ])
        if (sp.status === 'fulfilled' && sp.value.ok) {
          const xs: StudyProgram[] = await sp.value.json()
          studyPrograms = xs.map((sp) => ({
            label: fmtStudyProgram(sp),
            id: sp.specialization?.id ?? sp.po.id,
            badge: fmtStudyProgramShort(sp)
          }))
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
      }
    }
  }
}

export const moduleFilter = createModuleFilter()
