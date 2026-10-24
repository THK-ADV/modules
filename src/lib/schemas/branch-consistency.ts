import { z } from 'zod/v4'

const moduleSummarySchema = z.object({
  moduleId: z.uuid(),
  title: z.string().nullable(),
  ects: z.number().nullable()
})

export const branchConsistencySchema = z.object({
  isConsistent: z.boolean(),
  checkedAt: z.iso.datetime(),
  moduleDraftCount: z.number().int().nonnegative(),
  moduleBranchCount: z.number().int().nonnegative(),
  branchesWithoutDraft: z.array(
    moduleSummarySchema.extend({
      branchName: z.string(),
      branchUrl: z.url({ protocol: /^https?$/ })
    })
  ),
  draftsWithoutBranch: z.array(moduleSummarySchema)
})
