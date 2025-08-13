import { GITHUB_OWNER, GITHUB_REPO } from '$env/static/private'
import type { GitHubRelease } from '$lib/types/github'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ fetch }) => {
  const response = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases`
  )

  if (!response.ok) {
    const err = await response.json()
    throw error(response.status, { message: `GitHub API error: ${err.message}` })
  }

  const releases: GitHubRelease[] = await response.json()

  return { releases }
}
