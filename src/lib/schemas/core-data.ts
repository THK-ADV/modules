import { z } from 'zod/v4'

export const identityTitleSchema = z.enum([
  '',
  'B.Sc.',
  'M.Sc.',
  'Dipl.-Ing.',
  'Dipl.-Ing. (FH)',
  'Dipl.-Inf. M.Sc.',
  'Dipl.-Math.',
  'Dipl.-Psych.',
  'Diplom-Kulturwirtin',
  'Dr.',
  'Dr.-Ing.',
  'PhD',
  'Prof.',
  'Prof. Dr.',
  'Prof. Dr. Dr.',
  'Prof. Dr. (em.)'
])

export const employmentTypeSchema = z.enum(
  ['prof', 'wma', 'adjunct_lecturer', 'unknown'],
  'Beschäftigungsart ist erforderlich'
)
export type EmploymentType = z.infer<typeof employmentTypeSchema>

export const ectsFactorSchema = z.enum(
  { ects25: 25, ects30: 30 },
  'ECTS-Faktor muss 25 oder 30 sein'
)
export type EctsFactor = z.infer<typeof ectsFactorSchema>

const labelSchema = z.object({ id: z.string(), deLabel: z.string(), enLabel: z.string() })
const personSchema = z.object({
  id: z.string(),
  kind: z.literal('person'),
  lastname: z.string(),
  firstname: z.string(),
  title: z.string(),
  abbreviation: z.string(),
  campusId: z.string().nullish(),
  employmentType: employmentTypeSchema,
  faculties: z.array(z.string()),
  isActive: z.boolean(),
  websiteUrl: z.string().nullish()
})
const groupIdentitySchema = z.object({
  id: z.string(),
  kind: z.enum(['group', 'unknown']),
  label: z.string()
})

export const coreDataSchemas = {
  locations: labelSchema,
  languages: labelSchema,
  status: labelSchema,
  moduleTypes: labelSchema,
  seasons: labelSchema,
  assessmentMethods: labelSchema.extend({ source: z.enum(['rpo', 'unknown']) }),
  degrees: labelSchema.extend({ deDesc: z.string(), enDesc: z.string() }),
  identities: z.discriminatedUnion('kind', [personSchema, groupIdentitySchema]),
  studyPrograms: labelSchema.extend({
    abbreviation: z.string(),
    degree: z.string(),
    programDirectors: z.array(z.string()),
    examDirectors: z.array(z.string())
  }),
  pos: z.object({
    id: z.string(),
    program: z.string(),
    version: z.number().int(),
    dateFrom: z.iso.date(),
    dateTo: z.iso.date().nullish(),
    ectsFactor: ectsFactorSchema
  }),
  specializations: z.object({
    id: z.string(),
    label: z.string(),
    abbreviation: z.string(),
    po: z.string()
  }),
  teachingUnits: z.object({
    id: z.uuid(),
    label: z.string(),
    abbrev: z.string(),
    faculty: z.string()
  }),
  rooms: z.object({
    id: z.uuid(),
    label: z.string(),
    abbrev: z.string(),
    type: z.string(),
    capacity: z.number().int()
  })
}

export const coreDataKeySchema = z.object(coreDataSchemas).keyof()
export type CoreDataKey = z.infer<typeof coreDataKeySchema>
export type CoreDataRow = z.infer<(typeof coreDataSchemas)[CoreDataKey]>
type KeysOfUnion<T> = T extends unknown ? keyof T : never
export type CoreDataFieldName = KeysOfUnion<CoreDataRow>

const required = (label: string) => z.string().trim().min(1, `${label} ist erforderlich`)
const idSchema = required('ID').refine(
  (value) => !/[\s/?#]/.test(value) && value !== '.' && value !== '..',
  'ID darf keine Leerzeichen oder URL-Sonderzeichen enthalten'
)
const optional = <T extends z.ZodType<string>>(schema: T) =>
  z
    .union([schema, z.literal('')])
    .transform((v) => v || null)
    .nullish()
const labels = { id: idSchema, deLabel: required('Bezeichnung (DE)'), enLabel: z.string().trim() }
const editableLabelSchema = labelSchema.extend(labels)

export const coreDataFormSchemas = {
  locations: editableLabelSchema,
  languages: editableLabelSchema,
  status: editableLabelSchema,
  moduleTypes: editableLabelSchema,
  seasons: editableLabelSchema,
  assessmentMethods: coreDataSchemas.assessmentMethods.extend(labels),
  degrees: coreDataSchemas.degrees.extend({
    ...labels,
    deDesc: z.string().trim(),
    enDesc: z.string().trim()
  }),
  identities: z.discriminatedUnion('kind', [
    personSchema.extend({
      id: idSchema,
      lastname: required('Nachname'),
      firstname: required('Vorname'),
      title: identityTitleSchema,
      abbreviation: required('Kürzel'),
      campusId: optional(z.string().trim()),
      websiteUrl: optional(z.url('Ungültige URL'))
    }),
    groupIdentitySchema.extend({ id: idSchema, label: required('Bezeichnung') })
  ]),
  studyPrograms: coreDataSchemas.studyPrograms.extend({
    ...labels,
    abbreviation: required('Abkürzung'),
    degree: required('Abschluss'),
    programDirectors: z.array(z.string()).min(1, 'Studiengangsleitung ist erforderlich'),
    examDirectors: z.array(z.string()).min(1, 'Prüfungsausschussvorsitz ist erforderlich')
  }),
  pos: coreDataSchemas.pos
    .extend({
      id: idSchema,
      program: required('Studiengang'),
      version: z.coerce.number().int().positive('Version muss positiv sein'),
      dateFrom: z.iso.date('Gültig ab ist erforderlich'),
      dateTo: optional(z.iso.date()),
      ectsFactor: z.coerce.number('ECTS-Faktor muss 25 oder 30 sein').pipe(ectsFactorSchema)
    })
    .refine((value) => !value.dateTo || value.dateTo >= value.dateFrom, {
      message: 'Gültig bis darf nicht vor Gültig ab liegen',
      path: ['dateTo']
    }),
  specializations: coreDataSchemas.specializations.extend({
    id: idSchema,
    label: required('Bezeichnung'),
    abbreviation: required('Abkürzung'),
    po: required('Prüfungsordnung')
  }),
  teachingUnits: coreDataSchemas.teachingUnits.omit({ id: true }).extend({
    label: required('Bezeichnung'),
    abbrev: required('Abkürzung'),
    faculty: required('Fakultät')
  }),
  rooms: coreDataSchemas.rooms.omit({ id: true }).extend({
    label: z.string().trim(),
    abbrev: required('Abkürzung'),
    type: z.string().trim(),
    capacity: z
      .union([z.number(), required('Kapazität')], 'Kapazität ist erforderlich')
      .pipe(
        z.coerce.number<string | number>().int().nonnegative('Kapazität darf nicht negativ sein')
      )
  })
}
