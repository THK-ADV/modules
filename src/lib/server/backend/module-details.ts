import {
  moduleDetailResponseSchema,
  moduleDraftStateResponseSchema,
  type ModuleDetail
} from '$lib/schemas/module-details'
import type { ModuleDraftState } from '$lib/types/module-draft'
import { z } from 'zod/v4'
import { fetchBackendJson, parseBackendRequestInput } from './http'

function fetchModuleDetailState(
  fetch: typeof globalThis.fetch,
  id: string,
  prefix: '/api' | '/auth-api',
  suffix: string,
  errorMessage: string
): Promise<ModuleDetail> {
  const moduleId = parseBackendRequestInput(z.uuid(), id, 'Ungültige Modul-ID')
  return fetchBackendJson(
    fetch,
    `${prefix}/modules/${encodeURIComponent(moduleId)}${suffix}?extend=true`,
    moduleDetailResponseSchema,
    errorMessage
  )
}

/** Fetches the published state of a module. */
export function fetchModuleDetail(
  fetch: typeof globalThis.fetch,
  id: string
): Promise<ModuleDetail> {
  return fetchModuleDetailState(fetch, id, '/api', '', 'Fehler beim Laden des Moduls')
}

/** Fetches the latest state of a module. */
export function fetchLatestModuleDetail(
  fetch: typeof globalThis.fetch,
  id: string
): Promise<ModuleDetail> {
  return fetchModuleDetailState(
    fetch,
    id,
    '/auth-api',
    '/latest',
    'Fehler beim Laden des aktuellen Modulstands'
  )
}

/** Fetches the workflow state of a module draft. */
export async function fetchModuleDraftState(
  fetch: typeof globalThis.fetch,
  id: string
): Promise<ModuleDraftState> {
  const moduleId = parseBackendRequestInput(z.uuid(), id, 'Ungültige Modul-ID')
  const { id: state } = await fetchBackendJson(
    fetch,
    `/auth-api/moduleDrafts/${encodeURIComponent(moduleId)}`,
    moduleDraftStateResponseSchema,
    'Fehler beim Laden des Modulstatus'
  )
  return state
}
