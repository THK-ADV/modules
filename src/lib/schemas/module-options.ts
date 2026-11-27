import { coreDataSchemas } from './core-data'
import { z } from 'zod/v4'

/** Label of a core data entry to choose in the module editor. */
export const labelOptionSchema = z.object({ id: z.string(), deLabel: z.string() })

/** The parts of an identity that name, abbreviate and order it. */
export const identityOptionSchema = z.discriminatedUnion('kind', [
  z.object({
    id: z.string(),
    kind: z.literal('person'),
    firstname: z.string(),
    lastname: z.string(),
    abbreviation: z.string()
  }),
  z.object({ id: z.string(), kind: z.enum(['group', 'unknown']), label: z.string() })
])

export const teachingUnitOptionSchema = coreDataSchemas.teachingUnits.pick({
  id: true,
  label: true
})

export const roomOptionSchema = coreDataSchemas.rooms.pick({ id: true, abbrev: true })

/** Module of `/modules?source=…`. */
export const moduleCoreSchema = z.object({
  id: z.string(),
  title: z.string(),
  abbreviation: z.string(),
  ects: z.number(),
  isLive: z.boolean(),
  moduleManagement: z.array(
    z.object({
      id: z.string(),
      kind: z.enum(['person', 'group', 'unknown']),
      lastname: z.string().nullable(),
      firstname: z.string().nullable()
    })
  )
})

/** Generic module of `/modules?type=generic`, with the full PO IDs it belongs to. */
export const genericModuleSchema = z.object({
  id: z.string(),
  title: z.string(),
  abbrev: z.string(),
  pos: z.array(z.string())
})

export type LabelOption = z.infer<typeof labelOptionSchema>
export type IdentityOption = z.infer<typeof identityOptionSchema>
export type ModuleCore = z.infer<typeof moduleCoreSchema>
export type GenericModule = z.infer<typeof genericModuleSchema>
