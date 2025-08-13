export interface GitHubRelease {
  id: number
  tag_name: string
  name: string
  body: string
  published_at: string
  draft: boolean
  prerelease: boolean
  html_url: string
}
