<script lang="ts">
  import type { PageData } from './$types'
  import { Badge } from '$lib/components/ui/badge'
  import { Tag, GitBranch } from '@lucide/svelte'
  import { marked } from 'marked'

  export let data: PageData

  $: releases = data.releases

  function formatReleaseDate(dateString: string): string {
    return new Date(dateString)
      .toLocaleDateString('de-DE', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
      .replace(/(\d+)\.\s*(\w+)\.\s*(\d+)/, '$1 $2. $3')
      .toUpperCase()
  }
</script>

<div class="mx-auto flex h-full max-w-4xl flex-1 flex-col space-y-8 px-4">
  <div class="space-y-2 text-center">
    <h2 class="text-3xl font-bold tracking-tight">Release Notes</h2>
    <p class="text-sm text-muted-foreground">
      Aktuelle Release Notes zum Modulverwaltungssystem am Campus Gummersbach der TH Köln.
    </p>
  </div>

  <div class="space-y-10">
    {#if releases === undefined}
      <div class="py-8 text-center text-muted-foreground">Lade Releases ...</div>
    {:else if releases.filter((r) => !r.draft).length === 0}
      <div class="py-8 text-center text-muted-foreground">Noch keine Releases vorhanden :(</div>
    {:else}
      {#each releases as release (release.id)}
        {#if !release.draft}
          <div class="flex gap-8 rounded-xl border border-muted bg-background/80 p-6 shadow-sm">
            <!-- Date -->
            <div class="flex-shrink-0 pt-2 text-sm font-semibold">
              {formatReleaseDate(release.published_at)}
            </div>

            <!-- Release content -->
            <div class="flex-1">
              <a
                href={release.html_url}
                target="_blank"
                rel="noopener noreferrer"
                class="flex-shrink-0 text-xl font-semibold underline underline-offset-4"
              >
                {release.name}
              </a>

              <div class="mb-2 mt-2">
                <Badge
                  variant="outline"
                  class="inline-flex w-fit items-center px-2.5 py-0.5 text-muted-foreground"
                >
                  <Tag class="mr-1 h-3 w-3 flex-shrink-0" />
                  <span class="text-xs">{release.tag_name}</span>
                </Badge>

                <Badge
                  variant="outline"
                  class="inline-flex w-fit items-center px-1.5 py-0.5 text-muted-foreground"
                >
                  <GitBranch class="mr-1 h-3 w-3 flex-shrink-0" />
                  <span class="text-xs">{release.target_commitish}</span>
                </Badge>

                {#if release.prerelease}
                  <Badge
                    variant="outline"
                    class="inline-flex w-fit items-center border-orange-500 bg-orange-50 px-1.5 py-0.5 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
                  >
                    <span class="text-xs">Pre-release</span>
                  </Badge>
                {/if}
              </div>

              <div class="prose prose-sm mt-3 max-w-none dark:prose-invert">
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                {@html marked.parse(release.body)}
              </div>
            </div>
          </div>
        {/if}
      {/each}
    {/if}
  </div>
</div>
