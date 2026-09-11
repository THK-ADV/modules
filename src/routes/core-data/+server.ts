import { resolve } from '$app/paths'
import { coreDataEntities } from '$lib/core-data/entities'
import { CORE_DATA_ROUTE_ID } from '$lib/routes'
import { redirect } from '@sveltejs/kit'

export function GET() {
  redirect(303, resolve(CORE_DATA_ROUTE_ID, { entity: coreDataEntities[0].key }))
}
