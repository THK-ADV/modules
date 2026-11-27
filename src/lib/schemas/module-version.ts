import { z } from 'zod/v4'
import { semesterSchema } from './semester'

/** Revision of a module of `/modules/:id/history`, derived from a git commit. */
export const moduleVersionSchema = z.object({
  commitId: z.string(),
  committedAt: z.string(),
  content: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('parsed'),
      module: z.object({ id: z.string(), title: z.string(), abbrev: z.string() }),
      fileContent: z.string()
    }),
    z.object({ type: z.literal('deleted') }),
    z.object({ type: z.literal('parseError'), message: z.string() })
  ]),
  semester: semesterSchema
})

export type ModuleVersion = z.infer<typeof moduleVersionSchema>

export function isParsed(
  v: ModuleVersion
): v is ModuleVersion & { content: Extract<ModuleVersion['content'], { type: 'parsed' }> } {
  return v.content.type === 'parsed'
}
