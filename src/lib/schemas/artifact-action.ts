import { moduleCatalogConfigSchema } from '$lib/schemas/module-catalog'
import { z } from 'zod/v4'

export const artifactPoSchema = z.string().trim().min(1)

export const moduleCatalogArtifactInputSchema = z.object({
  po: artifactPoSchema,
  config: moduleCatalogConfigSchema
})

export const artifactPoInputSchema = z.object({
  po: artifactPoSchema
})
