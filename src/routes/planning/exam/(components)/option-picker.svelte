<script lang="ts" module>
  export interface PickerOption {
    id: string
    label: string
    /** Secondary text, also searchable. */
    hint?: string
    /** Further search terms that are not shown. */
    keywords?: string[]
    /** Integer interval `[from, to]` matched by comparisons in the search, e.g. a room's exam seats. */
    range?: [number, number]
  }

  /** `20 < x`, `x > 20`, `>20`, `<=50`; `20 < x < 30` yields two bounds. */
  const COMPARISON = /(\d+)\s*(<=?)\s*x|x?\s*([<>]=?)\s*(\d+)/gi

  /**
   * Splits a search into text terms and the inclusive integer bounds of its comparisons.
   * Strict bounds become inclusive ones (`>20` is `>=21`), as the compared values are integers.
   */
  function parseSearch(search: string, comparisons: boolean) {
    let min = -Infinity
    let max = Infinity
    let compared = false
    const text = !comparisons
      ? search
      : search.replace(COMPARISON, (_, left, leftOp, op, right) => {
          compared = true
          if (left !== undefined) min = Math.max(min, +left + (leftOp === '<' ? 1 : 0))
          else if (op[0] === '>') min = Math.max(min, +right + (op === '>' ? 1 : 0))
          else max = Math.min(max, +right - (op === '<' ? 1 : 0))
          return ' '
        })
    return {
      // A lone operator is a comparison still being typed.
      terms: text
        .toLocaleLowerCase('de')
        .split(/\s+/)
        .filter((term) => term && !(comparisons && /^[<>]=?$/.test(term))),
      bounds: compared ? ([min, max] as const) : null
    }
  }
</script>

<script lang="ts">
  import { Badge } from '$lib/components/ui/badge'
  import { Button } from '$lib/components/ui/button/index.js'
  import * as Command from '$lib/components/ui/command/index.js'
  import * as Popover from '$lib/components/ui/popover/index.js'
  import { Separator } from '$lib/components/ui/separator'
  import { cn } from '$lib/utils'
  import { Check, ChevronsUpDown, CirclePlus } from '@lucide/svelte'

  let {
    id,
    options,
    selected = [],
    onSelect,
    label,
    multiple = false,
    disabled = false,
    placeholder = 'Suchen …',
    chips,
    class: className
  }: {
    id?: string
    options: PickerOption[]
    selected?: string[]
    onSelect: (id: string) => void
    /** Trigger text summarizing the selection. */
    label: string
    /** Keeps the list open to toggle several options. */
    multiple?: boolean
    disabled?: boolean
    placeholder?: string
    /**
     * Selection shown as badges in the trigger like the multi-select of the module editor, each with
     * its full name as `title`. With badges, `label` becomes the trigger's accessible name.
     */
    chips?: { id: string; label: string; title: string }[]
    class?: string
  } = $props()

  let open = $state(false)
  let search = $state('')
  let limit = $state(80)
  const searchable = $derived(
    options.map((option) => ({
      option,
      text: [option.label, option.hint ?? '', ...(option.keywords ?? [])]
        .join(' ')
        .toLocaleLowerCase('de')
    }))
  )
  const query = $derived(
    parseSearch(
      search,
      options.some((o) => o.range)
    )
  )
  // An option matches if its text has every term and its range overlaps the bounds.
  const matches = $derived(
    searchable.filter(
      ({ option: { range }, text }) =>
        (!query.bounds ||
          (range !== undefined && range[0] <= query.bounds[1] && range[1] >= query.bounds[0])) &&
        query.terms.every((term) => text.includes(term))
    )
  )
  const visible = $derived(matches.slice(0, limit))
</script>

<Popover.Root
  bind:open
  onOpenChange={() => {
    search = ''
    limit = 80
  }}
>
  <Popover.Trigger>
    {#snippet child({ props })}
      <Button
        {...props}
        {id}
        {disabled}
        variant="outline"
        role="combobox"
        aria-expanded={open}
        aria-label={chips?.length ? label : undefined}
        class={cn(
          'h-9 justify-between gap-2 font-normal',
          chips && 'h-auto min-h-9 justify-start py-1.5 text-left',
          className
        )}
      >
        {#if chips}
          <CirclePlus aria-hidden="true" />
        {/if}
        {#if chips?.length}
          <Separator orientation="vertical" class="mx-1 h-4 min-h-0" />
          <span class="flex min-w-0 flex-1 flex-wrap gap-1">
            {#each chips as chip (chip.id)}
              <Badge
                variant="secondary"
                class="max-w-full rounded-sm px-1 font-normal"
                title={chip.title}
              >
                <span class="truncate">{chip.label}</span>
              </Badge>
            {/each}
          </span>
        {:else}
          <span class="truncate">{label}</span>
        {/if}
        <ChevronsUpDown class={cn('opacity-50', chips && 'ml-auto')} aria-hidden="true" />
      </Button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content class="w-80 p-0" align="start">
    <Command.Root shouldFilter={false}>
      <Command.Input
        bind:value={search}
        oninput={() => (limit = 80)}
        {placeholder}
        class="h-8 border-0 shadow-none focus:ring-0"
      />
      <Command.List>
        {#if !matches.length}
          <p class="text-muted-foreground py-6 text-center text-sm">Keine Treffer</p>
        {/if}
        <Command.Group>
          {#each visible as { option } (option.id)}
            <Command.Item
              value={option.id}
              onSelect={() => {
                onSelect(option.id)
                if (!multiple) open = false
              }}
            >
              <Check
                class={cn('shrink-0', !selected.includes(option.id) && 'opacity-0')}
                aria-hidden="true"
              />
              <span class="min-w-0 flex-1">
                <span class="block truncate">{option.label}</span>
                {#if option.hint}
                  <span class="text-muted-foreground block truncate text-xs">{option.hint}</span>
                {/if}
              </span>
            </Command.Item>
          {/each}
        </Command.Group>
        {#if matches.length > visible.length}
          <div class="border-t p-2">
            <Button variant="ghost" size="sm" class="w-full" onclick={() => (limit += 80)}>
              Weitere anzeigen ({matches.length - visible.length})
            </Button>
          </div>
        {/if}
      </Command.List>
    </Command.Root>
  </Popover.Content>
</Popover.Root>
