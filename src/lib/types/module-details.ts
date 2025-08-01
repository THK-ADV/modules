import type { Workload as CoreWorkload, Participants } from './core'
import type { AssessmentPrerequisite, AttendanceRequirement } from './module-protocol'

export interface Content {
  learningOutcome: string
  moduleContent: string
  learningMethods: string
  literature: string
  particularities: string
}

export interface ModuleShort {
  id: string
  title: string
  abbreviation: string
}

export interface GenericModuleOption extends ModuleShort {
  status: string
}

export interface Prerequisite {
  text: string
  modules: ModuleShort[]
}

export interface POMandatory {
  poId: string
  poVersion: number
  poECTSFactor: number
  studyProgramId: string
  studyProgramLabel: string
  studyProgramAbbreviation: string
  degree: string
  specializationLabel: string | null
  specializationAbbrev: string | null
  recommendedSemester: number[]
}

export interface POOptional extends POMandatory {
  instanceOf: ModuleShort
  partOfCatalog: boolean
}

export interface Person {
  kind: 'person'
  id: string
  title: string
  imageUrl: string | null
  websiteUrl: string | null
  isActive: boolean
  firstname: string
  lastname: string
  abbreviation: string
  employmentType: string
  faculties: string[]
}

export interface Other {
  kind: 'group' | 'unknown'
  id: string
  title: string
  isActive: boolean
}

export type Identity = Person | Other

export interface Assessment {
  label: string
  source: string
  percentage: number | null
  preconditions: string[]
}

export interface Parent {
  relationType: 'parent'
  modules: ModuleShort[]
}

export interface Child {
  relationType: 'child'
  module: ModuleShort
}

export type ModuleRelation = Parent | Child

export interface Workload extends CoreWorkload {
  total: number
  selfStudy: number
}

export interface ModuleDetail {
  id: string
  lastModified: string
  title: string
  abbreviation: string
  ects: number
  moduleType: {
    id: string
    label: string
  }
  language: {
    id: string
    label: string
  }
  duration: number
  season: string
  status: {
    id: string
    label: string
  }
  location: string
  examPhases: string[]
  firstExaminer: Identity
  secondExaminer: Identity
  workload: Workload
  participants: Participants | null
  moduleManagement: Identity[]
  lecturer: Identity[]
  assessments: Assessment[]
  poMandatory: POMandatory[]
  poOptional: POOptional[]
  taughtWith: ModuleShort[]
  requiredPrerequisites: Prerequisite | null
  recommendedPrerequisites: Prerequisite | null
  deContent: Content
  enContent: Content
  moduleRelation?: ModuleRelation
  assessmentPrerequisite: AssessmentPrerequisite | null
  attendanceRequirement: AttendanceRequirement | null
}
