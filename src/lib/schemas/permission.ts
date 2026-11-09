import { z } from 'zod/v4'

export const permissionTypeSchema = z.object({ id: z.string(), label: z.string() })
export type PermissionType = z.infer<typeof permissionTypeSchema>

export const permissionSchema = z.object({
  id: z.number().int(),
  person: z.object({ id: z.string(), firstname: z.string(), lastname: z.string() }),
  permType: permissionTypeSchema,
  context: z.array(z.string()).nullable()
})
export type Permission = z.infer<typeof permissionSchema>

export const permissionFormSchema = z.object({
  person: z.string().trim().min(1, 'Person ist erforderlich'),
  permType: z.string().trim().min(1, 'Berechtigung ist erforderlich'),
  context: z.array(z.string())
})
