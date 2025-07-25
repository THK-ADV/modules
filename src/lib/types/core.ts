// Identity

import type { IdentityKind } from './module'

export interface Person {
  id: string
  lastname: string
  firstname: string
  title: string
  abbreviation: string
  kind: 'person'
  employmentType: string
  imageUrl: string | null
  faculties: string[]
  websiteUrl: string | null
}

export interface UnknownIdentity {
  id: string
  label: string
  kind: 'unknown'
}

export interface Group {
  id: string
  label: string
  kind: 'group'
}

export type Identity = Person | UnknownIdentity | Group

export interface DisplayIdentity {
  identity: Identity
  label: string
}

// Degree

export interface Degree {
  id: string
  deLabel: string
  enLabel: string
  deDesc: string
  enDesc: string
}

// Participants

export interface Participants {
  min: number
  max: number
}

// Workload

export interface Workload {
  lecture: number
  seminar: number
  practical: number
  exercise: number
  projectSupervision: number
  projectWork: number
}

export interface ModuleType {
  id: string
  deLabel: string
}

export interface Language {
  id: string
  deLabel: string
}

export interface Season {
  id: string
  deLabel: string
}

export interface Location {
  id: string
  deLabel: string
}

export interface Status {
  id: string
  deLabel: string
}

export interface AssessmentMethod {
  id: string
  deLabel: string
  isRPO: boolean
}

export interface ExamPhase {
  id: string
  label: string
  abbrev: string
}

export interface Precondition {
  id: string
  label: string
}

export interface ModuleManagement {
  id: string
  kind: IdentityKind
  lastname: string
  firstname: string
}

export interface ModuleCore {
  id: string
  title: string
  abbreviation: string
  ects: number
  isLive: boolean
  moduleManagement: ModuleManagement[]
}

export interface GenericModule {
  id: string
  title: string
  abbrev: string
  pos: string[]
}

export interface PO {
  id: string
  ectsFactor: number
}
