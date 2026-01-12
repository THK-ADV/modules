<script lang="ts">
  import { Badge } from '$lib/components/ui/badge'
  import { Tag } from '@lucide/svelte'
  import { marked } from 'marked'
  import type { PageProps } from './$types'

  const { data }: PageProps = $props()
  const releases = $derived(data.releases)

  function formatReleaseDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }
</script>

<div class="flex h-full max-w-5xl flex-1 flex-col space-y-8">
  <div class="space-y-2">
    <h2 class="text-3xl font-bold tracking-tight">Release Notes</h2>
    <p class="text-muted-foreground text-sm">
      Aktuelle Release Notes zum Modulverwaltungssystem am Campus Gummersbach der TH Köln.
    </p>
  </div>

  <div class="space-y-6">
    {#if releases.filter((r) => !r.draft).length === 0}
      <div class="text-muted-foreground text-sm">Es sind noch keine Release Notes vorhanden.</div>
    {:else}
      {#each releases as release (release.id)}
        {#if !release.draft}
          <div
            class="border-muted bg-background/80 flex flex-col gap-4 rounded-xl border p-4 shadow-sm sm:flex-row sm:gap-8 sm:p-6"
          >
            <!-- Date -->
            <div class="mb-2 shrink-0 text-sm font-semibold sm:mb-0 sm:pt-2">
              {formatReleaseDate(release.published_at)}
            </div>

            <!-- Release content -->
            <div class="min-w-0 flex-1">
              <a
                href={release.html_url}
                target="_blank"
                rel="noopener noreferrer"
                class="shrink-0 text-xl font-semibold underline underline-offset-4"
              >
                {release.name}
              </a>

              <div class="mt-2 mb-2">
                <Badge
                  variant="outline"
                  class="text-muted-foreground inline-flex w-fit items-center px-2.5 py-0.5"
                >
                  <Tag class="mr-1.5 size-3 shrink-0" />
                  <span class="text-xs">{release.tag_name}</span>
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

              <div class="prose prose-sm dark:prose-invert mt-3 max-w-none">
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
