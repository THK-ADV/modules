import { z } from 'zod/v4'

/** Mirrors `permission.PermissionType` of the backend, including its labels. */
export const permissionTypes = [
  { id: 'module', label: 'Module der PO bearbeiten' },
  { id: 'approval-fast-forward', label: 'Review überspringen' },
  { id: 'admin', label: 'Admin' },
  { id: 'artifacts-preview', label: 'Artefakte anzeigen' },
  { id: 'artifacts-create', label: 'Artefakte erstellen' },
  { id: 'schedule-planning', label: 'Stundenplanung' }
]

export const permissionSchema = z.object({
  id: z.number().int(),
  person: z.object({ id: z.string(), firstname: z.string(), lastname: z.string() }),
  permType: z.object({ id: z.string(), label: z.string() }),
  context: z.array(z.string()).nullable()
})
export type Permission = z.infer<typeof permissionSchema>

export const permissionFormSchema = z.object({
  person: z.string().trim().min(1, 'Person ist erforderlich'),
  permType: z.string().trim().min(1, 'Berechtigung ist erforderlich'),
  context: z.array(z.string())
})
