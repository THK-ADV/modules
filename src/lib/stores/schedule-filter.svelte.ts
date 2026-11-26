import {
  createModuleFilterOptions,
  type ModuleFilterOption
} from '$lib/components/module-filter/types'
import { type StudyProgramFilterOption } from '$lib/components/study-program-filter'
import { toStudyProgramFilterOption } from '$lib/components/study-program-filter/options'
import { fmtPerson, fmtPersonShort, peopleOrdering } from '$lib/formats'
import type { Identity, ModuleCore } from '$lib/types/core'
import type { FilterData } from '$lib/types/filter-data'
import type { Room, TeachingUnit } from '$lib/types/schedule'
import type { StudyProgram } from '$lib/types/study-program'
import { getShareList, type FilterShareParams } from '$lib/components/filter-share'
import { uiStore } from './ui.svelte'
import {
  getArrayFromLocalStorage,
  getBooleanFromLocalStorage,
  setArrayToLocalStorage,
  setBooleanToLocalStorage
} from './local-storage'
import { getModuleTypeOptions, getSemesterOptions } from './store.svelte'

type FilterType = 'sf' | 'spf'

export function createScheduleFilter(prefix: FilterType) {
  // Search
  let searchString = $state('')

  let showSemester = $state(true)
  let showSchedule = $state(true)
  let showCampus = $state(true)
  let showFaculty = $state(false)
  let showExams = $state(true)
  const showModuleManagementFilter = prefix === 'sf'

  // Filter options
  let teachingUnits: FilterData[] = $state.raw([])
  let courseTypes: FilterData[] = $state.raw([])
  let modules: ModuleFilterOption[] = $state.raw([])
  const studyPrograms: StudyProgramFilterOption[] = $state.raw([])
  const studyProgramsWithSpecialization: StudyProgram[] = $state.raw([])
  let semesters: FilterData[] = $state.raw([])
  let identities: FilterData[] = $state.raw([])
  let rooms: FilterData[] = $state.raw([])
  let moduleTypes: FilterData[] = $state.raw([])

  // Selected options by the user
  let selectedTeachingUnits: string[] = $state([])
  let selectedCourseTypes: string[] = $state([])
  let selectedModules: string[] = $state([])
  let selectedStudyPrograms: string[] = $state([])
  let selectedSemesters: string[] = $state([])
  let selectedLecturers: string[] = $state([])
  let selectedModuleManagers: string[] = $state([])
  let selectedRooms: string[] = $state([])
  let selectedModuleTypes: string[] = $state([])

  // A shared link shows its filters without overwriting the viewer's own in local storage.
  let shared = $state(false)

  function save(key: string, value: string[] | boolean) {
    if (shared) return
    if (typeof value === 'boolean') {
      setBooleanToLocalStorage(`${prefix}-${key}`, value)
    } else {
      setArrayToLocalStorage(`${prefix}-${key}`, value)
    }
  }

  function loadFromLocalStorage() {
    showSemester = getBooleanFromLocalStorage(`${prefix}-show-semester-plan`, true)
    showSchedule = getBooleanFromLocalStorage(`${prefix}-show-schedule`, true)
    showCampus = getBooleanFromLocalStorage(`${prefix}-show-campus`, true)
    showFaculty = getBooleanFromLocalStorage(`${prefix}-show-faculty`, false)
    showExams = getBooleanFromLocalStorage(`${prefix}-show-exams`, true)
    selectedTeachingUnits = getArrayFromLocalStorage(`${prefix}-selected-teaching-units`)
    selectedCourseTypes = getArrayFromLocalStorage(`${prefix}-selected-course-types`)
    selectedModules = getArrayFromLocalStorage(`${prefix}-selected-modules`)
    selectedStudyPrograms = getArrayFromLocalStorage(`${prefix}-selected-study-programs`)
    selectedSemesters = getArrayFromLocalStorage(`${prefix}-selected-semesters`)
    selectedLecturers = getArrayFromLocalStorage(`${prefix}-selected-lecturers`)
    selectedModuleManagers = showModuleManagementFilter
      ? getArrayFromLocalStorage(`${prefix}-selected-module-managers`)
      : []
    selectedRooms = getArrayFromLocalStorage(`${prefix}-selected-rooms`)
    selectedModuleTypes = getArrayFromLocalStorage(`${prefix}-selected-module-types`)
  }
  loadFromLocalStorage()

  function shareParams(): FilterShareParams {
    const sources = [
      showSemester && 'semester',
      showSchedule && 'schedule',
      showCampus && 'campus',
      showFaculty && 'faculty',
      showExams && 'exams'
    ].filter((source) => source !== false)
    return {
      q: searchString,
      tu: selectedTeachingUnits,
      sem: selectedSemesters,
      sp: selectedStudyPrograms,
      mod: selectedModules,
      mt: selectedModuleTypes,
      ct: selectedCourseTypes,
      mm: selectedModuleManagers,
      lec: selectedLecturers,
      ro: selectedRooms,
      // `none` keeps "all sources off" apart from a link without sources, which keeps the viewer's own.
      src: sources.length > 0 ? sources : ['none'],
      ...uiStore.shareParams
    }
  }

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
      save('show-semester-plan', value)
    },
    get showSchedule() {
      return showSchedule
    },
    set showSchedule(value: boolean) {
      showSchedule = value
      save('show-schedule', value)
    },
    get showCampus() {
      return showCampus
    },
    set showCampus(value: boolean) {
      showCampus = value
      save('show-campus', value)
    },
    get showFaculty() {
      return showFaculty
    },
    set showFaculty(value: boolean) {
      showFaculty = value
      save('show-faculty', value)
    },
    get showExams() {
      return showExams
    },
    set showExams(value: boolean) {
      showExams = value
      save('show-exams', value)
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
      save('selected-course-types', selectedCourseTypes)
    },
    clearSelectedCourseTypes() {
      selectedCourseTypes = []
      save('selected-course-types', [])
    },
    selectTeachingUnit(id: string) {
      if (selectedTeachingUnits.includes(id)) {
        selectedTeachingUnits = selectedTeachingUnits.filter((x) => x !== id)
      } else {
        selectedTeachingUnits = [...selectedTeachingUnits, id]
      }
      save('selected-teaching-units', selectedTeachingUnits)
    },
    clearSelectedTeachingUnits() {
      selectedTeachingUnits = []
      save('selected-teaching-units', [])
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
      save('selected-modules', selectedModules)
    },
    clearSelectedModules() {
      selectedModules = []
      save('selected-modules', [])
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
      save('selected-study-programs', selectedStudyPrograms)
    },
    clearSelectedStudyPrograms() {
      selectedStudyPrograms = []
      save('selected-study-programs', [])
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
      save('selected-semesters', selectedSemesters)
    },
    clearSelectedSemesters() {
      selectedSemesters = []
      save('selected-semesters', [])
    },
    get identities() {
      return identities
    },
    get selectedLecturers() {
      return selectedLecturers
    },
    selectLecturer(id: string) {
      if (selectedLecturers.includes(id)) {
        selectedLecturers = selectedLecturers.filter((x) => x !== id)
      } else {
        selectedLecturers = [...selectedLecturers, id]
      }
      save('selected-lecturers', selectedLecturers)
    },
    clearSelectedLecturers() {
      selectedLecturers = []
      save('selected-lecturers', [])
    },
    get selectedModuleManagers() {
      return selectedModuleManagers
    },
    selectModuleManager(id: string) {
      if (!showModuleManagementFilter) return
      if (selectedModuleManagers.includes(id)) {
        selectedModuleManagers = selectedModuleManagers.filter((x) => x !== id)
      } else {
        selectedModuleManagers = [...selectedModuleManagers, id]
      }
      save('selected-module-managers', selectedModuleManagers)
    },
    clearSelectedModuleManagers() {
      if (!showModuleManagementFilter) return
      selectedModuleManagers = []
      save('selected-module-managers', [])
    },
    get showModuleManagementFilter() {
      return showModuleManagementFilter
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
      save('selected-rooms', selectedRooms)
    },
    clearSelectedRooms() {
      selectedRooms = []
      save('selected-rooms', [])
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
      save('selected-module-types', selectedModuleTypes)
    },
    clearSelectedModuleTypes() {
      selectedModuleTypes = []
      save('selected-module-types', [])
    },
    get studyProgramsWithSpecialization() {
      return studyProgramsWithSpecialization
    },
    // Share
    get shared() {
      return shared
    },
    get shareParams() {
      return shareParams()
    },
    applyShare(params: URLSearchParams | null) {
      if (!params) {
        if (shared) {
          shared = false
          loadFromLocalStorage()
          searchString = ''
          uiStore.applyShare(null)
        }
        return
      }
      shared = true
      // Keeps the viewer's own sources when the link has none.
      loadFromLocalStorage()
      uiStore.applyShare(params)
      searchString = params.get('q')?.trim() ?? ''
      selectedTeachingUnits = getShareList(params, 'tu')
      selectedSemesters = getShareList(params, 'sem')
      selectedStudyPrograms = getShareList(params, 'sp')
      selectedModules = getShareList(params, 'mod')
      selectedModuleTypes = getShareList(params, 'mt')
      selectedCourseTypes = getShareList(params, 'ct')
      selectedModuleManagers = showModuleManagementFilter ? getShareList(params, 'mm') : []
      selectedLecturers = getShareList(params, 'lec')
      selectedRooms = getShareList(params, 'ro')
      if (params.has('src')) {
        const sources = getShareList(params, 'src')
        showSemester = sources.includes('semester')
        showSchedule = sources.includes('schedule')
        showCampus = sources.includes('campus')
        showFaculty = sources.includes('faculty')
        showExams = sources.includes('exams')
      }
    },

    // Reset
    clearSelections() {
      searchString = ''
      this.clearSelectedTeachingUnits()
      this.clearSelectedCourseTypes()
      this.clearSelectedModules()
      this.clearSelectedStudyPrograms()
      this.clearSelectedSemesters()
      this.clearSelectedLecturers()
      this.clearSelectedModuleManagers()
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
        // fetch all study programs for planning mode
        const studyProgramFetch =
          prefix === 'spf'
            ? fetch('/api/studyPrograms?filter=not-expired')
            : fetch('/api/studyPrograms?filter=currently-active')
        const [tu, m, sp, id, ro] = await Promise.allSettled([
          fetch('/api/teachingUnits'),
          fetch('/api/modules?source=live'),
          studyProgramFetch,
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
          const xs: ModuleCore[] = await m.value.json()
          modules = createModuleFilterOptions(xs)
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
