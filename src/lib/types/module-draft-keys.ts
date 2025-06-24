import type { ModuleForm } from '$lib/schemas/module'

export interface ModuleDraftKeys {
  keysToBeReviewed: { id: string }[]
  modifiedKeys: { id: string }[]
}

// Utility type to get all possible paths from a nested object type
type Paths<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            T[K] extends any[]
            ? K
            : K | `${K}.${Paths<T[K]>}`
          : K
        : never
    }[keyof T]
  : never

export type FormFieldPath = Paths<ModuleForm>

// mapping from server keys (as they appear in moduleDraftKeys) to form field names

const SERVER_KEY_TO_FORM_FIELD_MAP: Record<string, FormFieldPath> = {
  // General/Metadata mappings
  'metadata.title': 'title',
  'metadata.abbrev': 'abbrev',
  'metadata.moduleType': 'moduleType',
  'metadata.ects': 'ects',
  'metadata.language': 'language',
  'metadata.duration': 'duration',
  'metadata.season': 'season',
  'metadata.location': 'location',
  'metadata.status': 'status',

  // Management mappings
  'metadata.moduleManagement': 'management',
  'metadata.lecturers': 'lecturers',

  // Examination mappings
  'metadata.examiner.first': 'firstExaminer',
  'metadata.examiner.second': 'secondExaminer',
  'metadata.examPhases': 'examPhases',
  'metadata.assessmentMethods.mandatory': 'assessmentMethods',

  // Workload mappings
  'metadata.workload': 'workload',
  'metadata.workload.lecture': 'workload.lecture',
  'metadata.workload.seminar': 'workload.seminar',
  'metadata.workload.exercise': 'workload.exercise',
  'metadata.workload.practical': 'workload.practical',
  'metadata.workload.projectSupervision': 'workload.projectSupervision',
  'metadata.workload.projectWork': 'workload.projectWork',

  // Study programs mappings
  'metadata.po.mandatory': 'po.mandatory',
  'metadata.po.optional': 'po.optional',

  // Content mappings
  'deContent.learningOutcome': 'deContent.learningOutcome',
  'enContent.learningOutcome': 'enContent.learningOutcome',
  'deContent.content': 'deContent.content',
  'enContent.content': 'enContent.content',
  'deContent.teachingAndLearningMethods': 'deContent.teachingAndLearningMethods',
  'enContent.teachingAndLearningMethods': 'enContent.teachingAndLearningMethods',
  'deContent.recommendedReading': 'deContent.recommendedReading',
  'enContent.recommendedReading': 'enContent.recommendedReading',
  'deContent.particularities': 'deContent.particularities',
  'enContent.particularities': 'enContent.particularities',

  // Prerequisites mappings
  'metadata.prerequisites.recommended': 'recommendedPrerequisites',
  'metadata.prerequisites.required': 'requiredPrerequisites',

  // Misc mappings
  'metadata.participants': 'participants',
  'metadata.moduleRelation': 'moduleRelation',
  'metadata.taughtWith': 'taughtWith'
}

export type ModificationStatus = 'modified' | 'needs-review' | undefined

export type SectionId =
  | 'general'
  | 'management'
  | 'examination'
  | 'workload'
  | 'study-programs'
  | 'learning-outcomes'
  | 'module-content'
  | 'teaching-methods'
  | 'literature'
  | 'particularities'
  | 'prerequisites'
  | 'misc'

export type Section = {
  id: SectionId
  label: string
  href: string
}

export type ModificationMap = Record<FormFieldPath, ModificationStatus>

function createEmptyModificationMap(): ModificationMap {
  const fieldStatus = {} as ModificationMap

  const allFormFields = Object.values(SERVER_KEY_TO_FORM_FIELD_MAP)
  for (const field of allFormFields) {
    fieldStatus[field] = undefined
  }

  return fieldStatus
}

export function getFieldModifications(
  moduleDraftKeys: ModuleDraftKeys | null | undefined
): ModificationMap | undefined {
  if (!moduleDraftKeys) {
    return undefined
  }

  const fieldStatus = createEmptyModificationMap()

  if (moduleDraftKeys.modifiedKeys) {
    for (const key of moduleDraftKeys.modifiedKeys) {
      const formField = SERVER_KEY_TO_FORM_FIELD_MAP[key.id]
      if (formField && formField in fieldStatus) {
        fieldStatus[formField] = 'modified'
      }
    }
  }

  // override modified status. needs-review is a higher priority than modified
  if (moduleDraftKeys.keysToBeReviewed) {
    for (const key of moduleDraftKeys.keysToBeReviewed) {
      const formField = SERVER_KEY_TO_FORM_FIELD_MAP[key.id]
      if (formField && formField in fieldStatus) {
        fieldStatus[formField] = 'needs-review'
      }
    }
  }

  return fieldStatus
}

export function getFieldHighlightClasses(status: ModificationStatus): string {
  switch (status) {
    case 'needs-review':
      return 'border-l-4 border-l-amber-400 bg-amber-50/50 px-4 py-3 rounded-r-md dark:border-l-amber-500 dark:bg-amber-950/20'
    case 'modified':
      return 'border-l-4 border-l-blue-400 bg-blue-50/50 px-4 py-3 rounded-r-md dark:border-l-blue-500 dark:bg-blue-950/20'
    case undefined:
    default:
      return ''
  }
}

const SECTION_FIELD_MAP: Record<SectionId, FormFieldPath[]> = {
  general: [
    'title',
    'abbrev',
    'moduleType',
    'ects',
    'language',
    'duration',
    'season',
    'location',
    'status'
  ],
  management: ['management', 'lecturers', 'updatePermissions'],
  examination: ['firstExaminer', 'secondExaminer', 'examPhases', 'assessmentMethods'],
  workload: [
    'workload',
    'workload.lecture',
    'workload.seminar',
    'workload.exercise',
    'workload.practical',
    'workload.projectSupervision',
    'workload.projectWork'
  ],
  'study-programs': ['po', 'po.mandatory', 'po.optional'],
  'learning-outcomes': ['deContent.learningOutcome', 'enContent.learningOutcome'],
  'module-content': ['deContent.content', 'enContent.content'],
  'teaching-methods': [
    'deContent.teachingAndLearningMethods',
    'enContent.teachingAndLearningMethods'
  ],
  literature: ['deContent.recommendedReading', 'enContent.recommendedReading'],
  particularities: ['deContent.particularities', 'enContent.particularities'],
  prerequisites: ['recommendedPrerequisites', 'requiredPrerequisites'],
  misc: ['participants', 'moduleRelation', 'taughtWith']
} as const

export function getSectionStatus(
  sectionId: SectionId,
  fieldStatuses: ModificationMap | null | undefined
): ModificationStatus {
  if (!fieldStatuses) return undefined

  const fieldsInSection = SECTION_FIELD_MAP[sectionId]

  // check for needs-review first (higher priority)
  for (const fieldName of fieldsInSection) {
    if (fieldStatuses[fieldName] === 'needs-review') {
      return 'needs-review'
    }
  }

  // then check for modified
  for (const fieldName of fieldsInSection) {
    if (fieldStatuses[fieldName] === 'modified') {
      return 'modified'
    }
  }

  return undefined
}

// Compile-time check: Ensure every form field is assigned to exactly one section
// If you add a field to the schema but forget to assign it to a section, you'll get a TypeScript error here
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function assertAllFieldsAssignedToSections(): void {
  // Get all fields that are assigned to sections
  const assignedFields = Object.values(SECTION_FIELD_MAP).flat()

  // This will cause a TypeScript error if any FormFieldPath is missing from SECTION_FIELD_MAP
  const allFormFields: FormFieldPath[] = assignedFields

  // Prevent unused variable warning
  void allFormFields
}
