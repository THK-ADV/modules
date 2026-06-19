import { error } from '@sveltejs/kit'
import type { output, ZodType } from 'zod/v4'

type ServerFetch = typeof globalThis.fetch
type FetchInput = Parameters<ServerFetch>[0]
type FetchInit = Parameters<ServerFetch>[1]

async function readBackendErrorMessage(resp: Response): Promise<string | null> {
  const body = await resp.json().catch(() => null)
  return typeof body?.message === 'string' ? body.message : null
}

export async function fetchBackend(
  fetch: ServerFetch,
  input: FetchInput,
  fallbackMessage: string,
  init?: FetchInit
): Promise<Response> {
  let resp: Response

  try {
    resp = await fetch(input, init)
  } catch {
    throw error(503, { message: 'Backend ist nicht erreichbar' })
  }

  if (!resp.ok) {
    const message = (await readBackendErrorMessage(resp)) || resp.statusText || fallbackMessage
    throw error(resp.status, { message })
  }

  return resp
}

export async function fetchBackendJson<Schema extends ZodType>(
  fetch: ServerFetch,
  input: FetchInput,
  schema: Schema,
  fallbackMessage: string,
  init?: FetchInit
): Promise<output<Schema>> {
  const resp = await fetchBackend(fetch, input, fallbackMessage, init)

  let data: unknown

  try {
    data = await resp.json()
  } catch {
    throw error(502, { message: fallbackMessage })
  }

  const result = schema.safeParse(data)
  if (!result.success) {
    console.error(`Ungültige Backend-Antwort für ${String(input)}`, result.error.issues)
    throw error(502, { message: fallbackMessage })
  }

  return result.data
}

export function parseBackendRequestInput<Schema extends ZodType>(
  schema: Schema,
  input: unknown,
  message: string
): output<Schema> {
  const result = schema.safeParse(input)
  if (!result.success) {
    console.error(message, result.error.issues)
    throw error(400, { message })
  }

  return result.data
}
