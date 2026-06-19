import { error } from '@sveltejs/kit'
import type { output, ZodType } from 'zod/v4'

export async function parseRequestJson<Schema extends ZodType>(
  request: Request,
  schema: Schema,
  message: string
): Promise<output<Schema>> {
  const result = schema.safeParse(await request.json().catch(() => null))
  if (!result.success) {
    console.error(message, result.error.issues)
    throw error(400, { message })
  }

  return result.data
}
