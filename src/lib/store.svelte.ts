import type {
  AssessmentMethod,
  DisplayIdentity,
  ExamPhase,
  GenericModule,
  Identity,
  Language,
  Location,
  ModuleCore,
  ModuleType,
  Season,
  Status
} from '$lib/types/core'
import type { StudyProgram } from '$lib/types/study-program'
import type { PaginationState } from '@tanstack/table-core'
import { type Selection } from '../routes/my-modules/(components)/types'
import {
  fmtPerson,
  fmtPersonShort,
  fmtStudyProgram,
  fmtStudyProgramShort,
  peopleOrdering
} from './formats'
import type { FilterData } from './types/filter-data'
import type { Room, ModuleCore as ScheduleModuleCore, TeachingUnit } from './types/schedule'

function getSemesterOptions() {
  return [
    { id: '1', label: '1', badge: '1' },
    { id: '2', label: '2', badge: '2' },
    { id: '3', label: '3', badge: '3' },
    { id: '4', label: '4', badge: '4' },
    { id: '5', label: '5', badge: '5' },
    { id: '6', label: '6', badge: '6' },
    { id: '7', label: '7', badge: '7' }
  ]
}

// changes to this affect lib/calendar/filter.ts and routes/modules/+page.svelte
function getModuleTypeOptions() {
  return [
    { id: 'pm', label: 'Pflichtmodul', badge: 'PM' },
    { id: 'wm', label: 'Wahlmodul', badge: 'WM' }
  ]
}

function createModuleFilter() {
  let studyPrograms = $state.raw(new Array<FilterData>())
  let identities = $state.raw(new Array<FilterData>())
  let semester = $state.raw(new Array<FilterData>())
  let moduleTypes = $state.raw(new Array<FilterData>())

  let selectedStudyPrograms = $state(new Array<string>())
  let selectedIdentities = $state(new Array<string>())
  let selectedSemester = $state(new Array<string>())
  let selectedModuleTypes = $state(new Array<string>())
  let title = $state('')

  const pages = ['15', '30', '45', 'Alle']
  let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: +pages[0] })

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
    },
    selectSemester(id: string) {
      if (selectedSemester.includes(id)) {
        selectedSemester = selectedSemester.filter((x) => x !== id)
      } else {
        selectedSemester.push(id)
      }
    },
    selectIdentity(id: string) {
      if (selectedIdentities.includes(id)) {
        selectedIdentities = selectedIdentities.filter((x) => x !== id)
      } else {
        selectedIdentities.push(id)
      }
    },
    selectModuleType(id: string) {
      if (selectedModuleTypes.includes(id)) {
        selectedModuleTypes = selectedModuleTypes.filter((x) => x !== id)
      } else {
        selectedModuleTypes.push(id)
      }
    },
    clearSelectedStudyPrograms() {
      selectedStudyPrograms = []
    },
    clearSelectedIdentities() {
      selectedIdentities = []
    },
    clearSelectedSemester() {
      selectedSemester = []
    },
    clearSelectedModuleTypes() {
      selectedModuleTypes = []
    },
    clearSelections() {
      selectedStudyPrograms = []
      selectedIdentities = []
      selectedSemester = []
      selectedModuleTypes = []
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

function createModuleUpdateState() {
  let moduleTypes = $state.raw(new Array<ModuleType>())
  let languages = $state.raw(new Array<Language>())
  let seasons = $state.raw(new Array<Season>())
  let locations = $state.raw(new Array<Location>())
  let status = $state.raw(new Array<Status>())
  let identities = $state.raw(new Array<DisplayIdentity>())
  let assessmentMethods = $state.raw(new Array<AssessmentMethod>())
  let examPhases = $state.raw(new Array<ExamPhase>())
  let modules = $state.raw(new Array<ModuleCore>())
  let studyPrograms = $state.raw(new Array<StudyProgram>())
  let genericModules = $state.raw(new Array<GenericModule>())

  return {
    get moduleTypes() {
      return moduleTypes
    },
    get languages() {
      return languages
    },
    get seasons() {
      return seasons
    },
    get locations() {
      return locations
    },
    get status() {
      return status
    },
    get identities() {
      return identities
    },
    get assessmentMethods() {
      return assessmentMethods
    },
    get examPhases() {
      return examPhases
    },
    get modules() {
      return modules
    },
    get studyPrograms() {
      return studyPrograms
    },
    get genericModules() {
      return genericModules
    },
    async fetchGenerationInformationState(fetch: typeof globalThis.fetch) {
      if (
        moduleTypes.length === 0 ||
        languages.length === 0 ||
        seasons.length === 0 ||
        locations.length === 0 ||
        status.length === 0
      ) {
        const [mt, ls, se, lo, st] = await Promise.allSettled([
          fetch(`/api/moduleTypes`),
          fetch(`/api/languages`),
          fetch(`/api/seasons`),
          fetch(`/api/locations`),
          fetch(`/api/status`)
        ])
        if (mt.status === 'fulfilled' && mt.value.ok) {
          moduleTypes = await mt.value.json()
        }
        if (ls.status === 'fulfilled' && ls.value.ok) {
          languages = await ls.value.json()
        }
        if (se.status === 'fulfilled' && se.value.ok) {
          seasons = await se.value.json()
        }
        if (lo.status === 'fulfilled' && lo.value.ok) {
          locations = await lo.value.json()
        }
        if (st.status === 'fulfilled' && st.value.ok) {
          status = await st.value.json()
        }
      }
    },
    async fetchManagementInfo(fetch: typeof globalThis.fetch) {
      if (identities.length === 0) {
        const res = await fetch(`/api/identities`)
        if (res.ok) {
          const xs: Identity[] = await res.json()
          xs.sort(peopleOrdering)
          identities = xs.map((i) => ({ identity: i, label: fmtPerson(i) }))
        }
      }
    },
    async fetchExaminationInfo(fetch: typeof globalThis.fetch) {
      if (assessmentMethods.length === 0 || examPhases.length === 0 || identities.length === 0) {
        const [all, rpo, phases, ids] = await Promise.allSettled([
          fetch(`/api/assessmentMethods`),
          fetch(`/api/assessmentMethods?source=rpo`),
          fetch(`/api/examPhases`),
          fetch(`/api/identities`)
        ])
        if (
          all.status === 'fulfilled' &&
          all.value.ok &&
          rpo.status === 'fulfilled' &&
          rpo.value.ok
        ) {
          // TODO: remove this merge if the backend returns the source
          const allMethods: AssessmentMethod[] = await all.value.json()
          const rpoMethods: AssessmentMethod[] = await rpo.value.json()
          const mergedMethods = allMethods.map((m) => {
            const isRPO = rpoMethods.some(({ id }) => id === m.id)
            return { ...m, isRPO }
          })
          mergedMethods.sort((a, b) => a.deLabel.localeCompare(b.deLabel))
          assessmentMethods = mergedMethods
        }
        if (phases.status === 'fulfilled' && phases.value.ok) {
          const xs: ExamPhase[] = await phases.value.json()
          xs.sort((a, b) => a.label.localeCompare(b.label))
          examPhases = xs
        }
        if (ids.status === 'fulfilled' && ids.value.ok) {
          const xs: Identity[] = await ids.value.json()
          xs.sort(peopleOrdering)
          identities = xs.map((i) => ({ identity: i, label: fmtPerson(i) }))
        }
      }
    },
    async fetchPrerequisitesInfo(fetch: typeof globalThis.fetch) {
      if (modules.length === 0) {
        const res = await fetch(`/api/modules?source=all`)
        if (res.ok) {
          const xs: ModuleCore[] = await res.json()
          xs.sort((a, b) => a.title.localeCompare(b.title))
          modules = xs
        }
      }
    },
    async fetchStudyProgramsInfo(fetch: typeof globalThis.fetch) {
      if (studyPrograms.length === 0 || genericModules.length === 0) {
        const [sp, gm] = await Promise.allSettled([
          fetch(`/api/studyPrograms?filter=not-expired`),
          fetch(`/api/modules?type=generic&source=all`)
        ])
        if (sp.status === 'fulfilled' && sp.value.ok) {
          const xs: StudyProgram[] = await sp.value.json()
          xs.sort((a, b) => {
            const label = a.deLabel.localeCompare(b.deLabel)
            if (label !== 0) {
              return label
            }
            const degree = a.degree.id.localeCompare(b.degree.id)
            if (degree !== 0) {
              return degree
            }
            return a.po.version - b.po.version
          })
          studyPrograms = xs
        }
        if (gm.status === 'fulfilled' && gm.value.ok) {
          const xs: GenericModule[] = await gm.value.json()
          xs.sort((a, b) => a.title.localeCompare(b.title))
          genericModules = xs
        }
      }
    },
    async fetchMiscInfo(fetch: typeof globalThis.fetch) {
      if (modules.length === 0) {
        const res = await fetch(`/api/modules?source=all`)
        if (res.ok) {
          const xs: ModuleCore[] = await res.json()
          xs.sort((a, b) => a.title.localeCompare(b.title))
          modules = xs
        }
      }
    }
  }
}

function createMyModuleFilter() {
  let currentSelection = $state<Selection>('my')
  let searchString = $state('')
  const pages = ['10', '25', '40', 'Alle']
  let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: +pages[0] })

  return {
    get searchString() {
      return searchString
    },
    get currentSelection() {
      return currentSelection
    },
    get pagination() {
      return pagination
    },
    get pages() {
      return pages
    },
    set searchString(value: string) {
      searchString = value
    },
    set currentSelection(value: Selection) {
      currentSelection = value
    },
    clearSelections() {
      searchString = ''
      currentSelection = 'my'
    },
    set pagination(value: PaginationState) {
      pagination = value
    }
  }
}

function createScheduleFilter() {
  // Search
  let searchString = $state('')

  // Source toggles
  let showHolidays = $state(true)
  let showSemester = $state(true)
  let showSchedule = $state(true)
  let showExams = $state(false)

  // Filter options
  let teachingUnits: FilterData[] = $state.raw([])
  let courseTypes: FilterData[] = $state.raw([])
  let modules: FilterData[] = $state.raw([])
  let studyPrograms: FilterData[] = $state.raw([])
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
  let selectedIdentities: string[] = $state([])
  let selectedRooms: string[] = $state([])
  let selectedModuleTypes: string[] = $state([])

  return {
    // Search
    get searchString() {
      return searchString
    },
    set searchString(value: string) {
      searchString = value
    },

    // Source toggles
    get showHolidays() {
      return showHolidays
    },
    set showHolidays(value: boolean) {
      showHolidays = value
    },
    get showSemester() {
      return showSemester
    },
    set showSemester(value: boolean) {
      showSemester = value
    },
    get showSchedule() {
      return showSchedule
    },
    set showSchedule(value: boolean) {
      showSchedule = value
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
    },
    clearSelectedCourseTypes() {
      selectedCourseTypes = []
    },
    selectTeachingUnit(id: string) {
      if (selectedTeachingUnits.includes(id)) {
        selectedTeachingUnits = selectedTeachingUnits.filter((x) => x !== id)
      } else {
        selectedTeachingUnits = [...selectedTeachingUnits, id] // TODO: look into this later
      }
    },
    clearSelectedTeachingUnits() {
      selectedTeachingUnits = []
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
    },
    clearSelectedModules() {
      selectedModules = []
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
    },
    clearSelectedStudyPrograms() {
      selectedStudyPrograms = []
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
    },
    clearSelectedSemesters() {
      selectedSemesters = []
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
    },
    clearSelectedIdentities() {
      selectedIdentities = []
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
    },
    clearSelectedRooms() {
      selectedRooms = []
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
    },
    clearSelectedModuleTypes() {
      selectedModuleTypes = []
    },
    // Reset
    clearSelections() {
      searchString = ''
      selectedTeachingUnits = []
      selectedCourseTypes = []
      selectedModules = []
      selectedStudyPrograms = []
      selectedSemesters = []
      selectedIdentities = []
      selectedRooms = []
      selectedModuleTypes = []
    },
    resetSources() {
      showHolidays = true
      showSemester = true
      showSchedule = true
      showExams = false
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
          studyPrograms = xs
            .filter(({ specialization }) => specialization === null)
            .map((sp) => ({
              label: fmtStudyProgram(sp),
              id: sp.po.id,
              badge: fmtStudyProgramShort(sp)
            }))
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

export const moduleFilter = createModuleFilter()

export const moduleUpdateState = createModuleUpdateState()

export const myModuleFilter = createMyModuleFilter()

export const scheduleFilter = createScheduleFilter()
