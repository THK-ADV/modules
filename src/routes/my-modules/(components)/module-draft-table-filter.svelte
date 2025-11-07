<script lang="ts">
  import Button from '$lib/components/ui/button/button.svelte'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import * as RadioGroup from '$lib/components/ui/radio-group/index.js'
  import { myModuleFilter } from '$lib/store.svelte'
  import type { ModuleDraft } from '$lib/types/module-draft'
  import { X } from '@lucide/svelte'
  import Filter from '@lucide/svelte/icons/filter'
  import Search from '@lucide/svelte/icons/search'
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

  function setFilterValue(value: string) {
    myModuleFilter.searchString = value
    table.getColumn('title')?.setFilterValue(value)
  }

  function setSelection(value: string) {
    myModuleFilter.currentSelection = value as Selection
    table.setGlobalFilter(value)
  }

  function reset() {
    myModuleFilter.clearSelections()
    table.getColumn('title')?.setFilterValue(myModuleFilter.searchString)
    table.setGlobalFilter(myModuleFilter.currentSelection)
  }
</script>

<div class="space-y-4">
  <!-- Search Section -->
  <div class="flex items-center gap-3">
    <div class="flex items-center gap-2 text-sm font-medium text-muted-foreground md:w-16">
      <Search class="h-4 w-4" />
      <span class="hidden md:inline">Suche</span>
    </div>
    <div class="flex-1">
      <Input
        placeholder="Suche nach Modulbezeichnung..."
        class="h-10 w-full max-w-md border-2 border-muted-foreground/20 text-sm transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
        type="search"
        value={myModuleFilter.searchString}
        onchange={(e) => setFilterValue(e.currentTarget.value)}
        oninput={(e) => setFilterValue(e.currentTarget.value)}
      />
    </div>
  </div>

  {#if hasAdditionalModules}
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-2 text-sm font-medium text-muted-foreground md:w-16">
        <Filter class="h-4 w-4" />
        <span class="hidden md:inline">Filter</span>
      </div>
      <RadioGroup.Root
        bind:value={myModuleFilter.currentSelection}
        onValueChange={(e) => setSelection(e)}
        class="flex gap-4 text-sm font-medium text-muted-foreground"
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
    </div>

    {#if showReset}
      <div class="flex items-center gap-3">
        <Button
          onclick={reset}
          variant="outline"
          size="sm"
          class="h-8 border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <X class="h-4 w-4" />
          Alle Filter zurücksetzen
        </Button>
      </div>
    {/if}
  {/if}
</div>
