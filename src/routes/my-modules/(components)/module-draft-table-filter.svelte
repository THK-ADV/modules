<script lang="ts">
  import { Badge } from '$lib/components/ui/badge/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import * as Collapsible from '$lib/components/ui/collapsible/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import * as RadioGroup from '$lib/components/ui/radio-group/index.js'
  import { IsMobile } from '$lib/hooks/is-mobile.svelte.js'
  import { myModuleFilter } from '$lib/stores/my-module-filter.svelte'
  import type { ModuleDraft } from '$lib/types/module-draft'
  import { ChevronDown, Funnel, Search, X } from '@lucide/svelte'
  import type { Table } from '@tanstack/table-core'
  import type { Selection } from './types'

  let {
    table,
    hasAdditionalModules
  }: { table: Table<ModuleDraft>; hasAdditionalModules: boolean } = $props()

  let showReset = $derived.by(() => {
    const { searchString } = myModuleFilter
    return searchString.length > 0
  })

  // Mobile handling
  let filtersOpen = $state(false)
  const isMobile = new IsMobile()

  let activeFilterDimensions = $derived.by(() => {
    if (!hasAdditionalModules) return 0
    return myModuleFilter.currentSelection && myModuleFilter.currentSelection !== 'my' ? 1 : 0
  })

  function setFilterValue(value: string) {
    myModuleFilter.searchString = value
    table.getColumn('title')?.setFilterValue(value)
  }

  function setSelection(value: string) {
    myModuleFilter.currentSelection = value as Selection
    table.setGlobalFilter(value)
  }

  function reset() {
    myModuleFilter.searchString = ''
    table.getColumn('title')?.setFilterValue(myModuleFilter.searchString)
  }

  // Quick search
  let searchInputEl: HTMLInputElement | null = $state(null)

  function handleGlobalKeydown(e: KeyboardEvent) {
    if (e.key === '/' && document.activeElement !== searchInputEl) {
      e.preventDefault()
      searchInputEl?.focus()
      return
    }
    if (e.key === 'Escape' && document.activeElement === searchInputEl) {
      e.preventDefault()
      setFilterValue('')
      searchInputEl?.blur()
    }
  }
</script>

<svelte:window onkeydown={handleGlobalKeydown} />

{#snippet draftFilterOptions()}
  <RadioGroup.Root
    bind:value={myModuleFilter.currentSelection}
    onValueChange={(e) => setSelection(e)}
    class="text-muted-foreground flex flex-wrap items-center gap-2 text-sm font-medium"
  >
    <div class="flex items-center space-x-2">
      <RadioGroup.Item value="my" id="r2" />
      <Label for="r2">
        <span class="md:hidden">Meine</span>
        <span class="hidden md:inline">Nur Meine Module</span>
      </Label>
    </div>
    <div class="flex items-center space-x-2">
      <RadioGroup.Item value="role" id="r3" />
      <Label for="r3">
        <span class="md:hidden">Rolle</span>
        <span class="hidden md:inline">Module aus zugewiesener Rolle</span>
      </Label>
    </div>
    <div class="flex items-center space-x-2">
      <RadioGroup.Item value="all" id="r1" />
      <Label for="r1">
        <span class="md:hidden">Alle</span>
        <span class="hidden md:inline">Alle Module</span>
      </Label>
    </div>
  </RadioGroup.Root>
{/snippet}

<div class="min-w-0 space-y-4">
  {#if isMobile.current && hasAdditionalModules}
    <Collapsible.Root bind:open={filtersOpen} class="min-w-0">
      <div class="flex min-w-0 items-center gap-1">
        <div
          class="text-muted-foreground hidden shrink-0 items-center gap-2 text-sm font-medium md:flex md:w-16"
        >
          <Search class="size-4" />
          <span>Suche</span>
        </div>
        <div class="w-full min-w-0 flex-1 md:w-auto">
          <Input
            placeholder="Suche nach Modulbezeichnung…"
            class="border-muted-foreground/20 focus-visible:border-primary focus-visible:ring-primary/20 h-10 w-full border-2 text-sm transition-colors focus-visible:ring-2 md:max-w-md"
            type="search"
            value={myModuleFilter.searchString}
            onchange={(e) => setFilterValue(e.currentTarget.value)}
            oninput={(e) => setFilterValue(e.currentTarget.value)}
            bind:ref={searchInputEl}
          />
        </div>

        <Collapsible.Trigger>
          {#snippet child({ props })}
            <Button
              {...props}
              variant="outline"
              class="border-muted-foreground/25 hover:bg-muted/50 h-10 w-auto justify-between gap-2 border-2 border-dashed px-2.5 font-medium"
              type="button"
            >
              <span class="flex min-w-0 items-center gap-2">
                <Funnel class="text-muted-foreground size-4 shrink-0" />
                <span class="max-w-30 truncate">Filter</span>
                {#if activeFilterDimensions > 0}
                  <Badge variant="secondary" class="shrink-0 rounded-sm px-1 tabular-nums">
                    {activeFilterDimensions}
                  </Badge>
                {/if}
              </span>
              <ChevronDown
                class={`text-muted-foreground size-4 shrink-0 transition-transform duration-200 ${filtersOpen ? 'rotate-180' : ''}`}
              />
            </Button>
          {/snippet}
        </Collapsible.Trigger>
      </div>

      <Collapsible.Content class="overflow-hidden">
        <div class="border-border/60 flex flex-wrap gap-2 border-t pt-3">
          {@render draftFilterOptions()}
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  {:else}
    <!-- Search Section -->
    <div class="flex min-w-0 items-center gap-3">
      <div
        class="text-muted-foreground hidden shrink-0 items-center gap-2 text-sm font-medium md:flex md:w-16"
      >
        <Search class="size-4" />
        <span>Suche</span>
      </div>
      <div class="w-full min-w-0 flex-1 md:w-auto">
        <Input
          placeholder="Suche nach Modulbezeichnung…"
          class="border-muted-foreground/20 focus-visible:border-primary focus-visible:ring-primary/20 h-10 w-full border-2 text-sm transition-colors focus-visible:ring-2 md:max-w-md"
          type="search"
          value={myModuleFilter.searchString}
          onchange={(e) => setFilterValue(e.currentTarget.value)}
          oninput={(e) => setFilterValue(e.currentTarget.value)}
          bind:ref={searchInputEl}
        />
      </div>
    </div>

    {#if hasAdditionalModules}
      <div class="flex min-w-0 items-center gap-3">
        <div
          class="text-muted-foreground flex shrink-0 items-center gap-2 text-sm font-medium md:w-16"
        >
          <Funnel class="size-4" />
          <span>Filter</span>
        </div>
        <div class="min-w-0 flex-1">
          {@render draftFilterOptions()}
        </div>
      </div>
    {/if}
  {/if}
  {#if showReset}
    <div class="flex items-center gap-3">
      <Button
        onclick={reset}
        variant="outline"
        size="sm"
        class="border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive h-8"
      >
        <X class="size-4" />
        Suche zurücksetzen
      </Button>
    </div>
  {/if}
</div>
