<script lang="ts">
  import { Badge } from '$lib/components/ui/badge'
  import { Button } from '$lib/components/ui/button'
  import * as Command from '$lib/components/ui/command'
  import * as Popover from '$lib/components/ui/popover'
  import { Separator } from '$lib/components/ui/separator'
  import type { FilterData } from '$lib/types/filter-data'
  import { cn } from '$lib/utils.js'
  import { Check, CirclePlus } from '@lucide/svelte'

  let {
    options,
    title,
    filterValues,
    handleSelect,
    clearFilters
  }: {
    options: FilterData[]
    title: string
    filterValues: string[]
    handleSelect: (id: string) => void
    clearFilters: () => void
  } = $props()

  let open = $state(false)

  let sortedOptions = $derived.by(() => {
    const selectedSet = new Set(filterValues)
    const selected: FilterData[] = []
    const unselected: FilterData[] = []
    for (const o of options) {
      if (selectedSet.has(o.id)) {
        selected.push(o)
      } else {
        unselected.push(o)
      }
    }
    return [...selected, ...unselected]
  })

  function fmtBadge(option: string): string {
    return options.find((o) => o.id === option)?.badge ?? ''
  }

  const hasActiveFilters = $derived(filterValues.length > 0)

  const triggerButtonClass = $derived(
    cn(
      'h-8 border-2 transition-[color,box-shadow,background-color,border-color] duration-200',
      !hasActiveFilters && 'border-dashed',
      hasActiveFilters && [
        'border-solid border-primary/28 hover:border-primary/35 dark:border-primary/55',
        'bg-primary/5 hover:bg-primary/10 dark:bg-primary/15 dark:hover:bg-primary/22'
      ]
    )
  )
</script>

<Popover.Root bind:open>
  <Popover.Trigger>
    <div>
      <Button variant="outline" size="sm" class={triggerButtonClass}>
        <CirclePlus class="size-4" />
        {title}
        {#if filterValues.length > 0}
          <Separator orientation="vertical" class="mx-1 h-4" />
          <Badge variant="secondary" class="rounded-sm px-1 font-normal lg:hidden">
            {filterValues.length}
          </Badge>
          <div class="hidden space-x-1 lg:flex">
            {#if filterValues.length > 2}
              <Badge variant="secondary" class="rounded-sm px-1 font-normal">
                {filterValues.length} Ausgewählt
              </Badge>
            {:else}
              {#each filterValues as option (option)}
                <Badge variant="secondary" class="rounded-sm px-1 font-normal">
                  {fmtBadge(option)}
                </Badge>
              {/each}
            {/if}
          </div>
        {/if}
      </Button>
    </div>
  </Popover.Trigger>
  <Popover.Content class="max-w-md p-0" align="start">
    <Command.Root>
      <Command.Input placeholder={title} class="h-8 border-0 shadow-none focus:ring-0" />
      <Command.List>
        <Command.Empty>Keine Ergebnisse</Command.Empty>
        {#if filterValues.length > 0}
          <Command.Separator />
          <Command.Item class="justify-center text-center" onSelect={clearFilters}>
            Filter zurücksetzen
          </Command.Item>
        {/if}
        <Command.Group>
          {#each sortedOptions as option (option.id)}
            <Command.Item
              value={option.id}
              keywords={[option.label]}
              onSelect={() => handleSelect(option.id)}
            >
              <div
                class={cn(
                  'border-primary mr-2 flex size-4 items-center justify-center rounded-sm border',
                  filterValues.includes(option.id)
                    ? 'bg-primary text-primary-foreground'
                    : 'opacity-50 [&_svg]:invisible'
                )}
              >
                <Check class="size-4" />
              </div>
              <span>{option.label}</span>
            </Command.Item>
          {/each}
        </Command.Group>
      </Command.List>
    </Command.Root>
  </Popover.Content>
</Popover.Root>
