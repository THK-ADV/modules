export interface GitHubUser {
  login: string
  id: number
  node_id: string
  avatar_url: string
  gravatar_id: string
  url: string
  html_url: string
  followers_url: string
  following_url: string
  gists_url: string
  starred_url: string
  subscriptions_url: string
  organizations_url: string
  repos_url: string
  events_url: string
  received_events_url: string
  type: string
  user_view_type: string
  site_admin: boolean
}

export interface GitHubAsset {
  name: string
  download_count: number
  browser_download_url: string
  size: number
}

export interface GitHubRelease {
  id: number
  tag_name: string
  name: string
  body: string
  published_at: string
  created_at: string
  draft: boolean
  prerelease: boolean
  html_url: string
  url: string
  assets_url: string
  upload_url: string
  tarball_url: string
  zipball_url: string
  node_id: string
  target_commitish: string
  immutable: boolean
  author: GitHubUser
  assets: GitHubAsset[]
}
