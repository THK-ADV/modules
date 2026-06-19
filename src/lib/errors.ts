import { isHttpError } from '@sveltejs/kit'

export function getErrorMessage(error: unknown, fallback = 'Unbekannter Fehler'): string {
  if (isHttpError(error)) {
    return error.body.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallback
}
