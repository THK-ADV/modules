import { error } from '@sveltejs/kit'

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
    const message = (await readBackendErrorMessage(resp)) ?? resp.statusText ?? fallbackMessage
    throw error(resp.status, { message })
  }

  return resp
}

export async function fetchBackendJson<T>(
  fetch: ServerFetch,
  input: FetchInput,
  fallbackMessage: string,
  init?: FetchInit
): Promise<T> {
  const resp = await fetchBackend(fetch, input, fallbackMessage, init)

  try {
    const data: T = await resp.json()
    return data
  } catch {
    throw error(502, { message: fallbackMessage })
  }
}
