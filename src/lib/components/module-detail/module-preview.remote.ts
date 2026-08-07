import { getRequestEvent, query } from '$app/server'
import { fetchLatestModuleDetail } from '$lib/server/backend/module-details'
import { z } from 'zod/v4'

export const getLatestModuleDetail = query(z.uuid(), async (id) => {
  const { fetch } = getRequestEvent()
  return fetchLatestModuleDetail(fetch, id)
})
