import type { PageServerLoad } from './$types'
import { GITHUB_OWNER, GITHUB_REPO } from '$env/static/private'
import type { GitHubRelease } from '$lib/types/github'
import { error } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ fetch }) => {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases`
    )

    if (!response.ok) {
      throw error(response.status, { message: `GitHub API error: ${response.status}` })
    }

    const releases: GitHubRelease[] = await response.json()

    return {
      releases
    }
  } catch (error) {
    console.error('Failed to fetch releases:', error)
    return {
      releases: [] as GitHubRelease[]
    }
  }
}
