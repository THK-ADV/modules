import { z } from 'zod/v4'
import { personSchema } from './core-data'

/** Permissions and open review counts of the signed-in user (`/auth-api/user`). */
export const userInfoSchema = z.object({
  person: personSchema,
  hasDirectorPrivileges: z.boolean(),
  hasModuleReviewPrivileges: z.boolean(),
  hasModulesToEdit: z.boolean(),
  hasExtendedModuleEditPermissions: z.boolean(),
  rejectedReviews: z.number(),
  reviewsToApprove: z.number(),
  // omitted when the user has no fast-forward approval permission
  fastForwardApprovalPOs: z.array(z.string()).optional(),
  hasSchedulePlanningPrivileges: z.boolean(),
  hasExamPlanningPrivileges: z.boolean(),
  // supersets of the respective planning privileges
  hasExamPlanningViewPrivileges: z.boolean(),
  hasSchedulePlanningViewPrivileges: z.boolean(),
  hasCoreDataEditPrivileges: z.boolean(),
  hasScheduleBookingPrivileges: z.boolean()
})

export type UserInfo = z.infer<typeof userInfoSchema>
