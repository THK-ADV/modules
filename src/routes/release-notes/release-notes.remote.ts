import { GITHUB_OWNER, GITHUB_REPO } from '$env/static/private'
import { getRequestEvent, query } from '$app/server'
import { releaseSchema, type Release } from '$lib/schemas/release'
import { fetchBackendJson } from '$lib/server/backend/http'
import { z } from 'zod/v4'

/** Published GitHub releases of the app. */
export const getReleases = query(async () => {
  const { fetch } = getRequestEvent()
  const releases = await fetchBackendJson(
    fetch,
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases`,
    z.array(releaseSchema),
    'Release Notes konnten nicht von GitHub geladen werden'
  )
  return releases.filter(
    (release): release is Release & { published_at: string } =>
      !release.draft && release.published_at !== null
  )
})
