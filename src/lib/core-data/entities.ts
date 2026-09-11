import { ectsFactorSchema, employmentTypeSchema, identityTitleSchema } from '$lib/schemas/core-data'
import type {
  CoreDataKey,
  CoreDataRow,
  CoreDataFieldName,
  EmploymentType
} from '$lib/schemas/core-data'

export interface CoreDataOption {
  id: string
  label: string
  /** shorter label for table cells; the form keeps `label` */
  tableLabel?: string
}

export interface CoreDataField {
  name: CoreDataFieldName
  label: string
  type: 'text' | 'textarea' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect'
  /** static options or the key of another entity whose rows serve as options */
  options?: CoreDataOption[] | CoreDataKey
  /** hide this field in the table */
  hidden?: boolean
  /** initial value when creating a new entry (defaults to '', false or []) */
  defaultValue?: unknown
  /** whether an optional date can be cleared */
  clearable?: boolean
  /** render the form field only when this returns true */
  showIf?: (values: Record<string, unknown>) => boolean
  /** how many selected badges to show before collapsing into "+n weitere" */
  maxVisibleBadges?: number
}

export interface CoreDataEntity {
  /** URL segment; the backend path is `/core-data/<key in lowercase>` */
  key: CoreDataKey
  label: string
  singular: string
  fields: CoreDataField[]
  /** human readable label of a row (table, select options) */
  display: (row: CoreDataRow) => string
  /** if set, the table gets a leading column with this header showing `display(row)` */
  displayColumn?: string
}

const idField: CoreDataField = { name: 'id', label: 'ID', type: 'text', hidden: true }
const labelFields: CoreDataField[] = [
  { name: 'deLabel', label: 'Bezeichnung (DE)', type: 'text' },
  { name: 'enLabel', label: 'Bezeichnung (EN)', type: 'text' }
]
const faculties: CoreDataOption[] = Array.from({ length: 12 }, (_, i) => {
  const id = `f${String(i + 1).padStart(2, '0')}`
  return { id, label: id.toUpperCase() }
})
const isPerson = (v: Record<string, unknown>) => v.kind === 'person'
const displayDe = (row: CoreDataRow) => ('deLabel' in row ? row.deLabel : row.id)
const employmentTypeLabels: Record<EmploymentType, { label: string; tableLabel: string }> = {
  prof: { label: 'Professor:in', tableLabel: 'Prof.' },
  wma: { label: 'Wissenschaftliche:r Mitarbeiter:in', tableLabel: 'WMA' },
  adjunct_lecturer: { label: 'Lehrbeauftragte:r', tableLabel: 'Lehrbeauf.' },
  unknown: { label: 'Unbekannt', tableLabel: '–' }
}
const ectsFactors: CoreDataOption[] = ectsFactorSchema.options.map((factor) => ({
  id: String(factor),
  label: String(factor)
}))

const labelEntity = (key: CoreDataKey, label: string, singular: string): CoreDataEntity => ({
  key,
  label,
  singular,
  fields: [idField, ...labelFields],
  display: displayDe
})

export const coreDataEntities: CoreDataEntity[] = [
  {
    key: 'identities',
    label: 'Personen & Gruppen',
    singular: 'Identität',
    fields: [
      idField,
      {
        name: 'kind',
        label: 'Art',
        type: 'select',
        defaultValue: 'person',
        hidden: true,
        options: [
          { id: 'person', label: 'Person' },
          { id: 'group', label: 'Gruppe' },
          { id: 'unknown', label: 'Unbekannt' }
        ]
      },
      {
        name: 'label',
        label: 'Bezeichnung',
        type: 'text',
        hidden: true,
        showIf: (v) => !isPerson(v)
      },
      { name: 'lastname', label: 'Nachname', type: 'text', hidden: true, showIf: isPerson },
      { name: 'firstname', label: 'Vorname', type: 'text', hidden: true, showIf: isPerson },
      {
        name: 'title',
        label: 'Titel',
        type: 'select',
        options: identityTitleSchema.options.map((title) => ({
          id: title,
          label: title || 'Kein Titel'
        })),
        hidden: true,
        showIf: isPerson
      },
      { name: 'abbreviation', label: 'Kürzel', type: 'text', hidden: true, showIf: isPerson },
      { name: 'campusId', label: 'Campus-ID', type: 'text', showIf: isPerson },
      {
        name: 'employmentType',
        label: 'Beschäftigungsart',
        type: 'select',
        showIf: isPerson,
        options: employmentTypeSchema.options.map((employmentType) => ({
          id: employmentType,
          ...employmentTypeLabels[employmentType]
        }))
      },
      {
        name: 'faculties',
        label: 'Fakultäten',
        type: 'multiselect',
        options: faculties,
        maxVisibleBadges: 4,
        showIf: isPerson
      },
      { name: 'isActive', label: 'Aktiv', type: 'boolean', defaultValue: true, showIf: isPerson },
      { name: 'websiteUrl', label: 'Website', type: 'text', hidden: true, showIf: isPerson }
    ],
    display: (row) =>
      'kind' in row && row.kind === 'person'
        ? `${row.lastname}, ${row.firstname}`
        : 'label' in row
          ? row.label
          : row.id,
    displayColumn: 'Name'
  },
  {
    key: 'rooms',
    label: 'Räume',
    singular: 'Raum',
    fields: [
      { name: 'label', label: 'Bezeichnung', type: 'text' },
      { name: 'abbrev', label: 'Abkürzung', type: 'text' },
      { name: 'type', label: 'Typ', type: 'text' },
      { name: 'capacity', label: 'Kapazität', type: 'number' }
    ],
    display: (row) => ('label' in row && 'abbrev' in row ? row.label || row.abbrev : row.id)
  },
  {
    key: 'studyPrograms',
    label: 'Studiengänge',
    singular: 'Studiengang',
    fields: [
      idField,
      ...labelFields,
      { name: 'abbreviation', label: 'Abkürzung', type: 'text' },
      { name: 'degree', label: 'Abschluss', type: 'select', options: 'degrees' },
      {
        name: 'programDirectors',
        label: 'Studiengangsleitung',
        type: 'multiselect',
        options: 'identities',
        maxVisibleBadges: 2,
        hidden: true
      },
      {
        name: 'examDirectors',
        label: 'Prüfungsausschussvorsitz',
        type: 'multiselect',
        options: 'identities',
        maxVisibleBadges: 2,
        hidden: true
      }
    ],
    display: (row) =>
      'deLabel' in row && 'abbreviation' in row ? `${row.deLabel} (${row.abbreviation})` : row.id
  },
  {
    key: 'pos',
    label: 'Prüfungsordnungen',
    singular: 'Prüfungsordnung',
    fields: [
      idField,
      { name: 'program', label: 'Studiengang', type: 'select', options: 'studyPrograms' },
      { name: 'version', label: 'Version', type: 'number' },
      { name: 'dateFrom', label: 'Gültig ab', type: 'date' },
      { name: 'dateTo', label: 'Gültig bis', type: 'date', clearable: true },
      {
        name: 'ectsFactor',
        label: 'ECTS-Faktor',
        type: 'select',
        options: ectsFactors,
        defaultValue: '30'
      }
    ],
    display: (row) => row.id
  },
  {
    key: 'specializations',
    label: 'Schwerpunkte',
    singular: 'Schwerpunkt',
    fields: [
      idField,
      { name: 'label', label: 'Bezeichnung', type: 'text' },
      { name: 'abbreviation', label: 'Abkürzung', type: 'text' },
      { name: 'po', label: 'Prüfungsordnung', type: 'select', options: 'pos' }
    ],
    display: (row) => ('label' in row ? row.label : row.id)
  },
  {
    key: 'degrees',
    label: 'Abschlüsse',
    singular: 'Abschluss',
    fields: [
      idField,
      ...labelFields,
      { name: 'deDesc', label: 'Beschreibung (DE)', type: 'textarea', hidden: true },
      { name: 'enDesc', label: 'Beschreibung (EN)', type: 'textarea', hidden: true }
    ],
    display: displayDe
  },
  {
    key: 'assessmentMethods',
    label: 'Prüfungsformen',
    singular: 'Prüfungsform',
    fields: [
      idField,
      ...labelFields,
      {
        name: 'source',
        label: 'Quelle',
        type: 'select',
        options: [
          { id: 'rpo', label: 'RPO' },
          { id: 'unknown', label: 'Unbekannt' }
        ]
      }
    ],
    display: displayDe
  },
  labelEntity('locations', 'Standorte', 'Standort'),
  labelEntity('languages', 'Sprachen', 'Sprache'),
  labelEntity('status', 'Status', 'Status'),
  labelEntity('moduleTypes', 'Modultypen', 'Modultyp'),
  labelEntity('seasons', 'Angebotsturnus', 'Angebotsturnus'),
  {
    key: 'teachingUnits',
    label: 'Lehreinheiten',
    singular: 'Lehreinheit',
    fields: [
      { name: 'label', label: 'Bezeichnung', type: 'text' },
      { name: 'abbrev', label: 'Abkürzung', type: 'text' },
      { name: 'faculty', label: 'Fakultät', type: 'select', options: faculties }
    ],
    display: (row) => ('label' in row ? row.label : row.id)
  }
]

export function getCoreDataEntity(key: string): CoreDataEntity | undefined {
  return coreDataEntities.find((entity) => entity.key === key)
}

// The shared table and form access heterogeneous rows through field metadata.
export function coreDataValue(row: CoreDataRow, field: CoreDataFieldName): unknown {
  return (row as Partial<Record<CoreDataFieldName, unknown>>)[field]
}
