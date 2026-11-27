import { z } from 'zod/v4'

/** GitHub release; drafts have no publication date yet. */
export const releaseSchema = z.object({
  id: z.number(),
  tag_name: z.string(),
  name: z.string().nullable(),
  body: z.string().nullable(),
  published_at: z.string().nullable(),
  draft: z.boolean(),
  prerelease: z.boolean(),
  html_url: z.string()
})

export type Release = z.infer<typeof releaseSchema>
