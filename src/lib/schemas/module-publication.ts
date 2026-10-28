import { z } from 'zod/v4'

const commitShaSchema = z.string().regex(/^[0-9a-f]{40}$/)

const fileChangeSchema = z.object({
  oldPath: z.string(),
  newPath: z.string(),
  newFile: z.boolean(),
  renamedFile: z.boolean(),
  deletedFile: z.boolean(),
  diff: z.string()
})

const moduleChangeSchema = z.object({
  id: z.uuid(),
  title: z.string().nullable(),
  abbrev: z.string().nullable(),
  change: z.enum(['added', 'modified', 'deleted']),
  file: fileChangeSchema
})

export const moduleChangesSchema = z.object({
  mainSha: commitShaSchema,
  previewSha: commitShaSchema,
  modules: z.array(moduleChangeSchema)
})

export const modulePublicationTitleSchema = z.object({
  title: z.string().trim().min(1).max(255)
})

export const modulePublicationRequestSchema = z.object({
  mainSha: commitShaSchema,
  previewSha: commitShaSchema,
  modules: z.array(z.uuid()).min(1),
  title: z.string().trim().min(1).max(255)
})

/** The opened merge request or, if selected modules changed since the comparison (HTTP 412), their IDs. */
export const modulePublicationResultSchema = z.union([
  z.object({ mergeRequestUrl: z.url({ protocol: /^https?$/ }) }),
  z.object({ modules: z.array(z.uuid()).min(1) })
])

export type FileChange = z.infer<typeof fileChangeSchema>
