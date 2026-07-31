import {
  moduleCatalogConfigOptionsSchema,
  type ModuleCatalogConfigOptions
} from '$lib/schemas/module-catalog'
import { z } from 'zod/v4'
import { fetchBackendJson, parseBackendRequestInput } from './http'

export async function fetchModuleCatalogConfigOptions(
  fetch: typeof globalThis.fetch,
  poId: string
): Promise<ModuleCatalogConfigOptions> {
  const input = parseBackendRequestInput(z.string().trim().min(1), poId, 'Ungültige PO ID')
  return fetchBackendJson(
    fetch,
    `/auth-api/moduleCatalogs/${encodeURIComponent(input)}/configOptions`,
    moduleCatalogConfigOptionsSchema,
    'Fehler beim Laden der Konfigurationsoptionen'
  )
}
