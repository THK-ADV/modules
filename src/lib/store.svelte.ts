import { authHeader, url } from '$lib/http'
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
import {
  fmtPerson,
  fmtPersonShort,
  fmtStudyProgram,
  fmtStudyProgramShort,
  peopleOrdering
} from './formats'
import type { FilterData } from './types/filter-data'

function createModuleFilter() {
  let studyPrograms = $state.raw(new Array<FilterData>())
  let identities = $state.raw(new Array<FilterData>())
  let semester = $state.raw(new Array<FilterData>())
  let selectedStudyPrograms = $state(new Array<string>())
  let selectedIdentities = $state(new Array<string>())
  let selectedSemester = $state(new Array<string>())

  return {
    get studyPrograms() {
      return studyPrograms
    },
    get identities() {
      return identities
    },
    get semester() {
      return semester
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
    clearSelectedStudyPrograms() {
      selectedStudyPrograms = []
    },
    clearSelectedIdentities() {
      selectedIdentities = []
    },
    clearSelectedSemester() {
      selectedSemester = []
    },
    clearSelections() {
      selectedStudyPrograms = []
      selectedIdentities = []
      selectedSemester = []
    },
    async init(fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) {
      if (semester.length === 0) {
        semester = [
          { id: '1', label: '1', badge: '1' },
          { id: '2', label: '2', badge: '2' },
          { id: '3', label: '3', badge: '3' },
          { id: '4', label: '4', badge: '4' },
          { id: '5', label: '5', badge: '5' },
          { id: '6', label: '6', badge: '6' },
          { id: '7', label: '7', badge: '7' }
        ]
      }
      if (studyPrograms.length === 0 || identities.length === 0) {
        const [sp, id] = await Promise.allSettled([
          fetch(url + '/studyPrograms?extend=true'),
          fetch(url + '/identities')
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
    async fetchGenerationInformationState(accessToken: string, fetch: typeof globalThis.fetch) {
      if (
        moduleTypes.length === 0 ||
        languages.length === 0 ||
        seasons.length === 0 ||
        locations.length === 0 ||
        status.length === 0
      ) {
        console.log('fetching general information…')
        const auth = authHeader(accessToken)

        const [mt, ls, se, lo, st] = await Promise.allSettled([
          fetch(`${url}/moduleTypes`, auth),
          fetch(`${url}/languages`, auth),
          fetch(`${url}/seasons`, auth),
          fetch(`${url}/locations`, auth),
          fetch(`${url}/status`, auth)
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
    async fetchManagementInfo(accessToken: string, fetch: typeof globalThis.fetch) {
      if (identities.length === 0) {
        console.log('fetching management info...')
        const auth = authHeader(accessToken)
        const res = await fetch(`${url}/identities`, auth)
        if (res.ok) {
          const xs: Identity[] = await res.json()
          xs.sort(peopleOrdering)
          identities = xs.map((i) => ({ identity: i, label: fmtPerson(i) }))
        }
      }
    },
    async fetchExaminationInfo(accessToken: string, fetch: typeof globalThis.fetch) {
      if (assessmentMethods.length === 0 || examPhases.length === 0 || identities.length === 0) {
        console.log('fetching examination info...')
        const auth = authHeader(accessToken)
        const [all, rpo, phases, ids] = await Promise.allSettled([
          fetch(`${url}/assessmentMethods`, auth),
          fetch(`${url}/assessmentMethods?source=rpo`, auth),
          fetch(`${url}/examPhases`, auth),
          fetch(`${url}/identities`, auth)
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
    async fetchPrerequisitesInfo(accessToken: string, fetch: typeof globalThis.fetch) {
      if (modules.length === 0) {
        console.log('fetching prerequisites info...')
        const auth = authHeader(accessToken)
        const res = await fetch(`${url}/modules?source=all`, auth)
        if (res.ok) {
          const xs: ModuleCore[] = await res.json()
          xs.sort((a, b) => a.title.localeCompare(b.title))
          modules = xs
        }
      }
    },
    async fetchStudyProgramsInfo(accessToken: string, fetch: typeof globalThis.fetch) {
      if (studyPrograms.length === 0 || genericModules.length === 0) {
        console.log('fetching study programs info...')
        const auth = authHeader(accessToken)
        const [sp, gm] = await Promise.allSettled([
          fetch(`${url}/studyPrograms?extend=true`, auth),
          fetch(`${url}/modules?type=generic&source=all`, auth)
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
    async fetchMiscInfo(accessToken: string, fetch: typeof globalThis.fetch) {
      if (modules.length === 0) {
        console.log('fetching misc info...')
        const auth = authHeader(accessToken)
        const res = await fetch(`${url}/modules?source=all`, auth)
        if (res.ok) {
          const xs: ModuleCore[] = await res.json()
          xs.sort((a, b) => a.title.localeCompare(b.title))
          modules = xs
        }
      }
    }
  }
}

export const moduleFilter = createModuleFilter()

export const moduleUpdateState = createModuleUpdateState()
