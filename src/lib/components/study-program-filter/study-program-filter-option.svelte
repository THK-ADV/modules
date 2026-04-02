<script lang="ts">
  import type { StudyProgramFilterDisplayVariant, StudyProgramFilterOption } from './types'
  import { Badge } from '$lib/components/ui/badge'
  import { Button } from '$lib/components/ui/button'
  import * as Command from '$lib/components/ui/command'
  import * as Popover from '$lib/components/ui/popover'
  import { Separator } from '$lib/components/ui/separator'
  import { cn } from '$lib/utils.js'
  import { Check, CirclePlus } from '@lucide/svelte'

  let {
    options,
    title,
    filterValues,
    handleSelect,
    clearFilters,
    displayVariant = 5
  }: {
    options: StudyProgramFilterOption[]
    title: string
    filterValues: string[]
    handleSelect: (id: string) => void
    clearFilters: () => void
    displayVariant?: StudyProgramFilterDisplayVariant
  } = $props()

  let sortedOptions = $derived.by(() => {
    const selectedSet = new Set(filterValues)
    const selected: StudyProgramFilterOption[] = []
    const unselected: StudyProgramFilterOption[] = []
    for (const o of options) {
      if (selectedSet.has(o.id)) {
        selected.push(o)
      } else {
        unselected.push(o)
      }
    }
    return [...selected, ...unselected]
  })

  let open = $state(false)

  function shortBadge(id: string): string {
    const opt = options.find((x) => x.id === id)
    if (!opt) return ''

    const sp = opt.studyProgram
    if (sp.specialization) {
      const spec =
        sp.specialization.id.split('_').at(-1)?.toUpperCase() ?? sp.specialization.deLabel
      return `${sp.abbreviation}-${spec} · PO${sp.po.version}`
    }
    return `${sp.abbreviation} · PO${sp.po.version}`
  }

  const hasActiveFilters = $derived(filterValues.length > 0)

  const triggerButtonClass = $derived(
    cn(
      'h-8 border-2 transition-[color,box-shadow,background-color,border-color] duration-200',
      !hasActiveFilters && 'border-dashed',
      hasActiveFilters && [
        'border-solid border-primary/28 hover:border-primary/35 dark:border-primary/55',
        'bg-primary/5 hover:bg-primary/10 dark:bg-primary/8 dark:hover:bg-primary/12'
      ]
    )
  )

  const itemClass = $derived(cn('items-start gap-2 py-2', displayVariant === 5 && 'pr-1'))

  const checkboxOffsetClass = $derived(displayVariant === 2 ? 'mt-1' : 'mt-0.5')

  // move to StudyProgramFilterOption interface once option 5 is picked
  function isPoTheOnlyContrastToNeighbor(
    list: StudyProgramFilterOption[],
    index: number,
    option: StudyProgramFilterOption
  ): boolean {
    const primary = option.label
    const degree = option.studyProgram.degree.deLabel
    const po = option.studyProgram.po.version

    const contrasts = (other: StudyProgramFilterOption) =>
      other.label === primary &&
      other.studyProgram.degree.deLabel === degree &&
      other.studyProgram.po.version !== po

    const prev = list[index - 1]
    const next = list[index + 1]
    return (!!prev && contrasts(prev)) || (!!next && contrasts(next))
  }
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
              {#each filterValues as optionId (optionId)}
                <Badge variant="secondary" class="rounded-sm px-1 font-normal">
                  {shortBadge(optionId)}
                </Badge>
              {/each}
            {/if}
          </div>
        {/if}
      </Button>
    </div>
  </Popover.Trigger>

  <Popover.Content class="w-[min(100vw-1.5rem,400px)] p-0" align="start">
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
          {#each sortedOptions as option, i (option.id)}
            {@const emphasizePoBadge =
              displayVariant === 5 && isPoTheOnlyContrastToNeighbor(sortedOptions, i, option)}
            <Command.Item
              value={option.id}
              keywords={[...option.searchKeywords]}
              class={itemClass}
              onSelect={() => handleSelect(option.id)}
            >
              <div
                class={cn(
                  'border-primary flex size-4 shrink-0 items-center justify-center rounded-sm border',
                  checkboxOffsetClass,
                  filterValues.includes(option.id)
                    ? 'bg-primary text-primary-foreground'
                    : 'opacity-50 [&_svg]:invisible'
                )}
              >
                <Check class="size-4" />
              </div>

              {#if displayVariant === 2}
                <div class="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
                  <span class="text-sm leading-snug font-medium wrap-break-word"
                    >{option.label}</span
                  >
                  <span class="text-muted-foreground text-xs leading-snug"
                    >{option.studyProgram.degree.deLabel} · PO{option.studyProgram.po.version}</span
                  >
                </div>
              {:else}
                <div
                  class="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                >
                  <span class="min-w-0 text-sm leading-snug font-medium wrap-break-word"
                    >{option.label}</span
                  >

                  <div class="flex shrink-0 flex-wrap items-center gap-1 sm:justify-end sm:pl-1">
                    <Badge
                      variant="outline"
                      class="text-muted-foreground h-5 shrink-0 rounded-sm px-1.5 text-[0.6875rem] font-normal"
                    >
                      {option.studyProgram.degree.deLabel}
                    </Badge>
                    <Badge
                      variant="outline"
                      class={cn(
                        'h-5 shrink-0 rounded-sm px-1.5 text-[0.6875rem]',
                        emphasizePoBadge
                          ? 'text-foreground/85 border-primary/25 bg-primary/5 dark:border-primary/30 dark:bg-primary/8 font-medium'
                          : 'text-muted-foreground font-normal'
                      )}
                    >
                      PO{option.studyProgram.po.version}
                    </Badge>
                  </div>
                </div>
              {/if}
            </Command.Item>
          {/each}
        </Command.Group>
      </Command.List>
    </Command.Root>
  </Popover.Content>
</Popover.Root>
