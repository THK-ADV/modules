<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js'
  import { Book, Eye, LoaderCircle, RotateCcw, SlidersHorizontal, X } from '@lucide/svelte'
  import { fade } from 'svelte/transition'
  import type { CatalogConfig } from './catalog-config.svelte'

  interface Chip {
    key: string
    label: string
    clear: () => void
  }

  let {
    config,
    generating,
    canCreate,
    onPreview,
    onCreate
  }: {
    config: CatalogConfig
    generating: 'preview' | 'create' | undefined
    canCreate: boolean
    onPreview: () => void
    onCreate: () => void
  } = $props()

  function fmtCount(count: number, singular: string, plural: string) {
    return `${count} ${count === 1 ? singular : plural}`
  }

  const chips: Chip[] = $derived.by(() => {
    const result: Chip[] = []
    if (config.excludedModuleCount > 0) {
      result.push({
        key: 'modules',
        label: fmtCount(
          config.excludedModuleCount,
          'Modul ausgeschlossen',
          'Module ausgeschlossen'
        ),
        clear: () => config.resetModules()
      })
    }
    if (config.electiveExclusionCount > 0) {
      result.push({
        key: 'electives',
        label: fmtCount(
          config.electiveExclusionCount,
          'Wahloption entfernt',
          'Wahloptionen entfernt'
        ),
        clear: () => config.resetElectiveOptions()
      })
    }
    if (config.semesterOverrideCount > 0) {
      result.push({
        key: 'semesters',
        label: fmtCount(config.semesterOverrideCount, 'Semester festgelegt', 'Semester festgelegt'),
        clear: () => config.resetSemesterSelections()
      })
    }
    if (config.occurrenceOverrideCount > 0) {
      result.push({
        key: 'occurrences',
        label: fmtCount(
          config.occurrenceOverrideCount,
          'Platzierung angepasst',
          'Platzierungen angepasst'
        ),
        clear: () => config.resetOccurrences()
      })
    }
    if (config.sectionCount > 0) {
      result.push({
        key: 'sections',
        label: fmtCount(config.sectionCount, 'Abschnitt definiert', 'Abschnitte definiert'),
        clear: () => config.resetSections()
      })
    }
    return result
  })
</script>

<div
  class="bg-background/95 supports-backdrop-filter:bg-background/80 sticky top-2 z-30 rounded-lg border px-4 py-3 shadow-sm backdrop-blur"
>
  <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
    <div class="flex min-w-0 flex-1 flex-wrap items-center gap-2">
      <SlidersHorizontal class="text-muted-foreground size-4 shrink-0" />
      {#if config.isDefault}
        <span class="text-sm font-medium">Standardkonfiguration</span>
        <span class="text-muted-foreground hidden text-sm sm:inline">
          – das Modulhandbuch wird mit den Standardeinstellungen erzeugt
        </span>
      {:else}
        <span class="text-primary text-sm font-semibold">
          {fmtCount(config.deviationCount, 'Anpassung', 'Anpassungen')}
        </span>
        {#each chips as chip (chip.key)}
          <span
            transition:fade={{ duration: 120 }}
            class="bg-secondary/60 text-secondary-foreground inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium"
          >
            {chip.label}
            <button
              type="button"
              class="text-muted-foreground hover:text-destructive -mr-0.5 rounded-full transition-colors"
              title="Diese Anpassungen zurücksetzen"
              aria-label="{chip.label} zurücksetzen"
              onclick={chip.clear}
            >
              <X class="size-3" />
            </button>
          </span>
        {/each}
      {/if}
    </div>

    <div class="flex items-center gap-2">
      {#if !config.isDefault}
        <Button variant="ghost" size="sm" onclick={() => config.resetAll()}>
          <RotateCcw />
          Zurücksetzen
        </Button>
      {/if}
      <Button variant="outline" size="sm" disabled={generating !== undefined} onclick={onPreview}>
        {#if generating === 'preview'}
          <LoaderCircle class="animate-spin" />
        {:else}
          <Eye />
        {/if}
        Vorschau
      </Button>
      {#if canCreate}
        <Button size="sm" disabled={generating !== undefined} onclick={onCreate}>
          {#if generating === 'create'}
            <LoaderCircle class="animate-spin" />
          {:else}
            <Book />
          {/if}
          Erstellen
        </Button>
      {/if}
    </div>
  </div>
</div>
