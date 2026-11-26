import { afterNavigate, goto } from '$app/navigation'
import { page } from '$app/state'
import { onDestroy } from 'svelte'

/** Filter state as URL params, keyed by param name. Lists are comma separated. */
export type FilterShareParams = Record<string, string | string[]>

/** A filter store that can show a shared view without overwriting the viewer's own filters. */
export interface ShareableFilter {
  readonly shareParams: FilterShareParams
  readonly shared: boolean
  /** Shows the shared filters, or restores the viewer's own filters on `null`. */
  applyShare(params: URLSearchParams | null): void
  clearSelections(): void
}

export function getShareList(params: URLSearchParams, key: string) {
  return params.get(key)?.split(',').filter(Boolean) ?? []
}

/**
 * Applies the share params of each visited URL to the filter and restores the viewer's own filters
 * when the page is left. Call during component init.
 */
export function syncShare(filter: ShareableFilter) {
  afterNavigate(({ to }) => {
    const params = to?.url.searchParams
    const shared = params && Object.keys(filter.shareParams).some((key) => params.has(key))
    filter.applyShare(shared ? params : null)
  })
  onDestroy(() => filter.applyShare(null))
}

export function getShareUrl({ shareParams }: ShareableFilter) {
  const url = new URL(page.url)
  for (const [key, value] of Object.entries(shareParams)) {
    const encoded = Array.isArray(value) ? value.join(',') : value.trim()
    if (encoded) {
      url.searchParams.set(key, encoded)
    } else {
      url.searchParams.delete(key)
    }
  }
  // Commas are valid in a query, so keep lists readable instead of `%2C`.
  url.search = url.search.replaceAll('%2C', ',')
  return url.href
}

/** Clears the viewer's filters, or leaves a shared view by dropping its params from the URL. */
export function resetFilter(filter: ShareableFilter) {
  if (!filter.shared) {
    filter.clearSelections()
    return
  }
  const url = new URL(page.url)
  for (const key of Object.keys(filter.shareParams)) {
    url.searchParams.delete(key)
  }
  goto(url, { replaceState: true, noScroll: true, keepFocus: true })
}
