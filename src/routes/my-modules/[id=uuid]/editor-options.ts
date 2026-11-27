import { browser } from '$app/environment'
import { navigating } from '$app/state'
import type { RemoteQueryFunction } from '@sveltejs/kit'

/** Editor options loaded in this browser session; the server keeps none between requests. */
const loaded = new Map<unknown, unknown>()

const hasEmptyList = (value: unknown) =>
  (Array.isArray(value) ? [value] : Object.values(value as object)).some(
    (list) => Array.isArray(list) && list.length === 0
  )

/**
 * Loads the options of `query` once per browser session, so that revisiting a tab does not
 * fetch them again. Failed or empty options load again on the next client navigation; hydration
 * keeps the server's result.
 */
export async function loadEditorOptions<T>(query: RemoteQueryFunction<void, T>): Promise<T> {
  if (loaded.has(query)) return loaded.get(query) as T
  const cached = query()
  if (navigating.type && !cached.loading) await cached.refresh()
  const options = await cached
  if (browser && !hasEmptyList(options)) loaded.set(query, options)
  return options
}
