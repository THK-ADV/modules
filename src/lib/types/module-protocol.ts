import type { Participants, Workload } from './core'

export interface ModuleRelation {
  kind: 'parent'
  children: string[]
}

export interface AssessmentEntry {
  method: string
  percentage: number | null
  precondition: string[]
}

export interface PrerequisiteEntry {
  text: string
  modules: string[]
}

export interface PORelation {
  po: string
  specialization: string | null
  recommendedSemester: number[]
}

export interface POMandatory extends PORelation {
  recommendedSemesterPartTime: number | null
}

export interface POOptional extends PORelation {
  instanceOf: string
  partOfCatalog: boolean
}

export interface AttendanceRequirement {
  min: string
  reason: string
  absence: string
}

export interface AssessmentPrerequisite {
  modules: string
  reason: string
}

export interface MetadataProtocol {
  title: string
  abbrev: string
  moduleType: string
  ects: number
  language: string
  duration: number
  season: string
  workload: Workload
  status: string
  location: string
  participants: Participants | null
  moduleRelation: ModuleRelation | null
  moduleManagement: string[]
  lecturers: string[]
  assessmentMethods: {
    mandatory: AssessmentEntry[]
  }
  examiner: {
    first: string
    second: string
  }
  examPhases: string[]
  prerequisites: {
    recommended: PrerequisiteEntry | null
    required: PrerequisiteEntry | null
  }
  po: {
    mandatory: POMandatory[]
    optional: POOptional[]
  }
  taughtWith: string[]
  attendanceRequirement: AttendanceRequirement | null
  assessmentPrerequisite: AssessmentPrerequisite | null
}

export interface Content {
  learningOutcome: string
  content: string
  teachingAndLearningMethods: string
  recommendedReading: string
  particularities: string
}

export interface ModuleProtocol {
  id: string
  metadata: MetadataProtocol
  deContent: Content
  enContent: Content
}
