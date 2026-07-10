import { z } from 'zod/v4'

export const artifactActionSchema = z.enum([
  'moduleCatalog',
  'moduleCatalog_creation',
  'examList',
  'examLoad'
])

export type ArtifactAction = z.infer<typeof artifactActionSchema>

export const artifactTargetSchema = z.string().trim().min(1)
