import { browser } from '$app/environment'
import { type StudyProgramFilterOption } from '$lib/components/study-program-filter'
import { toStudyProgramFilterOption } from '$lib/components/study-program-filter/options'
import { fmtPerson, fmtPersonShort, peopleOrdering } from '$lib/formats'
import type { Identity } from '$lib/types/core'
import type { FilterData } from '$lib/types/filter-data'
import type { Room, ModuleCore as ScheduleModuleCore, TeachingUnit } from '$lib/types/schedule'
import type { StudyProgram } from '$lib/types/study-program'
import {
  clearItemFromLocalStorage,
  getArrayFromLocalStorage,
  setArrayToLocalStorage,
  setBooleanToLocalStorage
} from './local-storage'
import { getModuleTypeOptions, getSemesterOptions } from './store.svelte'

type FilterType = 'sf' | 'spf'

function getShowSemesterPlanFromLocalStorage(prefix: FilterType): boolean {
  if (!browser) {
    return true
  }
  const value = localStorage.getItem(`${prefix}-show-semester-plan`)
  if (value) {
    return value === 'true'
  }
  return true
}

function getShowScheduleFromLocalStorage(prefix: FilterType): boolean {
  if (!browser) {
    return true
  }
  const value = localStorage.getItem(`${prefix}-show-schedule`)
  if (value) {
    return value === 'true'
  }
  return true
}

export function createScheduleFilter(prefix: FilterType) {
  // Search
  let searchString = $state('')

  let showSemester = $state(getShowSemesterPlanFromLocalStorage(prefix))
  let showSchedule = $state(getShowScheduleFromLocalStorage(prefix))
  let showExams = $state(false)

  // Filter options
  let teachingUnits: FilterData[] = $state.raw([])
  let courseTypes: FilterData[] = $state.raw([])
  let modules: FilterData[] = $state.raw([])
  const studyPrograms: StudyProgramFilterOption[] = $state.raw([])
  const studyProgramsWithSpecialization: StudyProgram[] = $state.raw([])
  let semesters: FilterData[] = $state.raw([])
  let identities: FilterData[] = $state.raw([])
  let rooms: FilterData[] = $state.raw([])
  let moduleTypes: FilterData[] = $state.raw([])

  // Selected options by the user
  let selectedTeachingUnits: string[] = $state(
    getArrayFromLocalStorage(`${prefix}-selected-teaching-units`)
  )
  let selectedCourseTypes: string[] = $state(
    getArrayFromLocalStorage(`${prefix}-selected-course-types`)
  )
  let selectedModules: string[] = $state(getArrayFromLocalStorage(`${prefix}-selected-modules`))
  let selectedStudyPrograms: string[] = $state(
    getArrayFromLocalStorage(`${prefix}-selected-study-programs`)
  )
  let selectedSemesters: string[] = $state(getArrayFromLocalStorage(`${prefix}-selected-semesters`))
  let selectedIdentities: string[] = $state(
    getArrayFromLocalStorage(`${prefix}-selected-identities`)
  )
  let selectedRooms: string[] = $state(getArrayFromLocalStorage(`${prefix}-selected-rooms`))
  let selectedModuleTypes: string[] = $state(
    getArrayFromLocalStorage(`${prefix}-selected-module-types`)
  )

  return {
    // Search
    get searchString() {
      return searchString
    },
    set searchString(value: string) {
      searchString = value
    },

    // Source toggles
    get showSemester() {
      return showSemester
    },
    set showSemester(value: boolean) {
      showSemester = value
      setBooleanToLocalStorage(`${prefix}-show-semester-plan`, value)
    },
    get showSchedule() {
      return showSchedule
    },
    set showSchedule(value: boolean) {
      showSchedule = value
      setBooleanToLocalStorage(`${prefix}-show-schedule`, value)
    },
    get showExams() {
      return showExams
    },
    set showExams(value: boolean) {
      showExams = value
    },

    // Filter options
    get teachingUnits() {
      return teachingUnits
    },
    get selectedTeachingUnits() {
      return selectedTeachingUnits
    },
    get courseTypes() {
      return courseTypes
    },
    get selectedCourseTypes() {
      return selectedCourseTypes
    },
    selectCourseType(id: string) {
      if (selectedCourseTypes.includes(id)) {
        selectedCourseTypes = selectedCourseTypes.filter((x) => x !== id)
      } else {
        selectedCourseTypes = [...selectedCourseTypes, id]
      }
      setArrayToLocalStorage(`${prefix}-selected-course-types`, selectedCourseTypes)
    },
    clearSelectedCourseTypes() {
      selectedCourseTypes = []
      clearItemFromLocalStorage(`${prefix}-selected-course-types`)
    },
    selectTeachingUnit(id: string) {
      if (selectedTeachingUnits.includes(id)) {
        selectedTeachingUnits = selectedTeachingUnits.filter((x) => x !== id)
      } else {
        selectedTeachingUnits = [...selectedTeachingUnits, id]
      }
      setArrayToLocalStorage(`${prefix}-selected-teaching-units`, selectedTeachingUnits)
    },
    clearSelectedTeachingUnits() {
      selectedTeachingUnits = []
      clearItemFromLocalStorage(`${prefix}-selected-teaching-units`)
    },
    get modules() {
      return modules
    },
    get selectedModules() {
      return selectedModules
    },
    selectModule(id: string) {
      if (selectedModules.includes(id)) {
        selectedModules = selectedModules.filter((x) => x !== id)
      } else {
        selectedModules = [...selectedModules, id]
      }
      setArrayToLocalStorage(`${prefix}-selected-modules`, selectedModules)
    },
    clearSelectedModules() {
      selectedModules = []
      clearItemFromLocalStorage(`${prefix}-selected-modules`)
    },
    get studyPrograms() {
      return studyPrograms
    },
    get selectedStudyPrograms() {
      return selectedStudyPrograms
    },
    selectStudyProgram(id: string) {
      if (selectedStudyPrograms.includes(id)) {
        selectedStudyPrograms = selectedStudyPrograms.filter((x) => x !== id)
      } else {
        selectedStudyPrograms = [...selectedStudyPrograms, id]
      }
      setArrayToLocalStorage(`${prefix}-selected-study-programs`, selectedStudyPrograms)
    },
    clearSelectedStudyPrograms() {
      selectedStudyPrograms = []
      clearItemFromLocalStorage(`${prefix}-selected-study-programs`)
    },
    get semesters() {
      return semesters
    },
    get selectedSemesters() {
      return selectedSemesters
    },
    selectSemester(id: string) {
      if (selectedSemesters.includes(id)) {
        selectedSemesters = selectedSemesters.filter((x) => x !== id)
      } else {
        selectedSemesters = [...selectedSemesters, id]
      }
      setArrayToLocalStorage(`${prefix}-selected-semesters`, selectedSemesters)
    },
    clearSelectedSemesters() {
      selectedSemesters = []
      clearItemFromLocalStorage(`${prefix}-selected-semesters`)
    },
    get identities() {
      return identities
    },
    get selectedIdentities() {
      return selectedIdentities
    },
    selectIdentity(id: string) {
      if (selectedIdentities.includes(id)) {
        selectedIdentities = selectedIdentities.filter((x) => x !== id)
      } else {
        selectedIdentities = [...selectedIdentities, id]
      }
      setArrayToLocalStorage(`${prefix}-selected-identities`, selectedIdentities)
    },
    clearSelectedIdentities() {
      selectedIdentities = []
      clearItemFromLocalStorage(`${prefix}-selected-identities`)
    },
    get rooms() {
      return rooms
    },
    get selectedRooms() {
      return selectedRooms
    },
    selectRoom(id: string) {
      if (selectedRooms.includes(id)) {
        selectedRooms = selectedRooms.filter((x) => x !== id)
      } else {
        selectedRooms = [...selectedRooms, id]
      }
      setArrayToLocalStorage(`${prefix}-selected-rooms`, selectedRooms)
    },
    clearSelectedRooms() {
      selectedRooms = []
      clearItemFromLocalStorage(`${prefix}-selected-rooms`)
    },
    get moduleTypes() {
      return moduleTypes
    },
    get selectedModuleTypes() {
      return selectedModuleTypes
    },
    selectModuleType(id: string) {
      if (selectedModuleTypes.includes(id)) {
        selectedModuleTypes = selectedModuleTypes.filter((x) => x !== id)
      } else {
        selectedModuleTypes = [...selectedModuleTypes, id]
      }
      setArrayToLocalStorage(`${prefix}-selected-module-types`, selectedModuleTypes)
    },
    clearSelectedModuleTypes() {
      selectedModuleTypes = []
      clearItemFromLocalStorage(`${prefix}-selected-module-types`)
    },
    get studyProgramsWithSpecialization() {
      return studyProgramsWithSpecialization
    },
    // Reset
    clearSelections() {
      searchString = ''
      this.clearSelectedTeachingUnits()
      this.clearSelectedCourseTypes()
      this.clearSelectedModules()
      this.clearSelectedStudyPrograms()
      this.clearSelectedSemesters()
      this.clearSelectedIdentities()
      this.clearSelectedRooms()
      this.clearSelectedModuleTypes()
    },

    async init(fetch: typeof globalThis.fetch) {
      if (semesters.length === 0) {
        semesters = getSemesterOptions()
      }
      if (courseTypes.length === 0) {
        courseTypes = [
          { id: 'lecture', label: 'Vorlesung', badge: 'V' },
          { id: 'lab', label: 'Praktikum', badge: 'P' },
          { id: 'exercise', label: 'Übung', badge: 'Ü' },
          { id: 'seminar', label: 'Seminar', badge: 'S' },
          { id: 'tutorial', label: 'Tutorium', badge: 'T' }
        ]
      }
      if (moduleTypes.length === 0) {
        moduleTypes = getModuleTypeOptions()
      }
      if (
        teachingUnits.length === 0 ||
        modules.length === 0 ||
        studyPrograms.length === 0 ||
        identities.length === 0 ||
        rooms.length === 0
      ) {
        const [tu, m, sp, id, ro] = await Promise.allSettled([
          fetch('/api/teachingUnits'),
          fetch('/api/modules?source=live'),
          fetch('/api/studyPrograms?filter=currently-active'),
          fetch('/api/identities'),
          fetch('/api/rooms')
        ])
        if (tu.status === 'fulfilled' && tu.value.ok) {
          const xs: TeachingUnit[] = await tu.value.json()
          teachingUnits = xs.map((tu) => ({
            id: tu.id,
            label: tu.label,
            badge: tu.label.slice(0, 3).toUpperCase()
          }))
        }
        if (m.status === 'fulfilled' && m.value.ok) {
          const xs: ScheduleModuleCore[] = await m.value.json()
          xs.sort((a, b) => a.title.localeCompare(b.title))
          modules = xs.map((m) => ({
            id: m.id,
            label: m.title,
            badge: m.abbrev
          }))
        }
        if (sp.status === 'fulfilled' && sp.value.ok) {
          const xs: StudyProgram[] = await sp.value.json()
          for (const sp of xs) {
            studyProgramsWithSpecialization.push(sp)
            if (!sp.specialization) {
              // Remove POs with specialization from UI filter
              studyPrograms.push(toStudyProgramFilterOption(sp))
            }
          }
        }
        if (id.status === 'fulfilled' && id.value.ok) {
          const xs: Identity[] = await id.value.json()
          xs.sort(peopleOrdering)
          identities = xs.map((i) => ({ id: i.id, label: fmtPerson(i), badge: fmtPersonShort(i) }))
        }
        if (ro.status === 'fulfilled' && ro.value.ok) {
          const xs: Room[] = await ro.value.json()
          rooms = xs.map((r) => ({ id: r.id, label: r.abbrev, badge: r.abbrev }))
        }
      }
    }
  }
}

export const scheduleFilter = createScheduleFilter('sf')
export const schedulePlanningFilter = createScheduleFilter('spf')
export type ScheduleFilter = typeof scheduleFilter
