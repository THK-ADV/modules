<script lang="ts">
  import { Badge } from '$lib/components/ui/badge'
  import { buttonVariants } from '$lib/components/ui/button'
  import * as Command from '$lib/components/ui/command'
  import * as Form from '$lib/components/ui/form'
  import * as Popover from '$lib/components/ui/popover'
  import { cn } from '$lib/utils.js'
  import { Check, ChevronsUpDown } from '@lucide/svelte'
  import type { ModuleFilterOption } from './types'

  // Performance pattern for large Command lists: keep the mounted DOM bounded.
  // Bits UI creates wrapper/state for every mounted item, so rendering all options is the hot path.
  const MAX_RENDERED_OPTIONS = 80

  interface Props {
    form: any // eslint-disable-line @typescript-eslint/no-explicit-any
    name: string
    label?: string
    placeholder: string
    description?: string
    options: ModuleFilterOption[]
    value: string
    errors?: any // eslint-disable-line @typescript-eslint/no-explicit-any
    width?: string
    disabled?: boolean
  }

  let {
    form,
    name,
    label,
    placeholder,
    description,
    options,
    value = $bindable(),
    errors = {},
    width = 'w-[min(100vw-1.5rem,560px)]',
    disabled = false
  }: Props = $props()

  let open = $state(false)
  let search = $state('')

  const selectedOption = $derived(options.find((option) => option.id === value))

  // Search input is normalized once here; option.searchText is precomputed in the option model.
  // This avoids rebuilding labels, badges, ECTS, and management strings on every keystroke.
  const searchTerms = $derived(
    search
      .trim()
      .toLocaleLowerCase('de-DE')
      .split(/\s+/)
      .filter((term) => term.length > 0)
  )

  // Own filtering replaces Command's internal scoring/sorting for this large list.
  // Keep Command mounted only for keyboard navigation and item selection behavior.
  const filteredOptions = $derived.by(() => {
    if (searchTerms.length === 0) {
      return options
    }

    return options.filter((option) => searchTerms.every((term) => option.searchText.includes(term)))
  })

  // Render only the first chunk. When no search is active, keep the current selection mounted
  // so reopening the combobox still shows the selected row as checked.
  const visibleOptions = $derived.by(() => {
    const visible = filteredOptions.slice(0, MAX_RENDERED_OPTIONS)

    if (
      searchTerms.length > 0 ||
      !selectedOption ||
      visible.some((option) => option.id === selectedOption.id)
    ) {
      return visible
    }

    return [selectedOption, ...visible.slice(0, MAX_RENDERED_OPTIONS - 1)]
  })

  // The count communicates that the result set is intentionally capped, not incomplete.
  const hiddenOptionCount = $derived(Math.max(filteredOptions.length - visibleOptions.length, 0))

  function onSelect(id: string) {
    if (disabled) return

    value = id
    form.validate(name)
    search = ''
    open = false
  }

  function handleOpenChange(nextOpen: boolean) {
    open = nextOpen
    if (!nextOpen) {
      search = ''
    }
  }
</script>

<Form.Field {form} {name}>
  <Popover.Root bind:open onOpenChange={handleOpenChange}>
    <Form.Control>
      {#snippet children({ props })}
        {#if label}
          <Form.Label>{label}</Form.Label>
        {/if}
        <Popover.Trigger
          {...props}
          role="combobox"
          {disabled}
          class={cn(
            buttonVariants({ variant: 'outline' }),
            'h-auto min-h-10 w-full justify-between px-3 py-2 text-left font-normal',
            !value && 'text-muted-foreground',
            errors[name] && 'border-destructive',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          {#if selectedOption}
            <span class="flex min-w-0 flex-1 flex-col items-start gap-1">
              <span class="text-foreground max-w-full truncate text-sm leading-snug">
                {selectedOption.label}
              </span>
              <span class="flex max-w-full flex-wrap items-center gap-1">
                <Badge
                  variant="outline"
                  class="text-muted-foreground h-5 shrink-0 rounded-sm px-1.5 text-[0.6875rem] font-medium"
                >
                  {selectedOption.abbreviation}
                </Badge>
                <Badge
                  variant="outline"
                  class="text-muted-foreground h-5 shrink-0 rounded-sm px-1.5 text-[0.6875rem] font-normal"
                >
                  {selectedOption.ectsLabel}
                </Badge>
                {#if selectedOption.managementLabel}
                  <span class="text-muted-foreground max-w-full truncate text-xs">
                    {selectedOption.managementLabel}
                  </span>
                {/if}
              </span>
            </span>
          {:else}
            <span class="min-w-0 flex-1 truncate">{placeholder}</span>
          {/if}
          <ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" />
        </Popover.Trigger>
        <input hidden {value} name={props.name} />
      {/snippet}
    </Form.Control>

    <Popover.Content class="{width} p-0" align="start">
      <!-- shouldFilter=false is the switch into manual mode: Svelte controls filtering and
        the amount of mounted items; Command still handles focus/selection semantics. -->
      <Command.Root shouldFilter={false}>
        <Command.Input
          bind:value={search}
          placeholder="Modul suchen..."
          class="h-8 border-0 shadow-none focus:ring-0"
        />
        <Command.List class="max-h-[360px]">
          {#if visibleOptions.length === 0}
            <div class="text-muted-foreground py-6 text-center text-sm">Keine Ergebnisse</div>
          {:else}
            <Command.Group>
              {#each visibleOptions as option (option.id)}
                <Command.Item
                  value={option.id}
                  class="items-start gap-2 py-2 pr-2"
                  onSelect={() => onSelect(option.id)}
                  {disabled}
                >
                  <Check
                    class={cn(
                      'mt-0.5 size-4 shrink-0',
                      option.id === value ? 'opacity-100' : 'opacity-0'
                    )}
                  />

                  <div class="flex min-w-0 flex-1 flex-col gap-1">
                    <div
                      class="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                    >
                      <span class="min-w-0 text-sm leading-snug font-medium wrap-break-word">
                        {option.label}
                      </span>

                      <div
                        class="flex shrink-0 flex-wrap items-center gap-1 sm:justify-end sm:pl-1"
                      >
                        <Badge
                          variant="outline"
                          class="text-muted-foreground h-5 shrink-0 rounded-sm px-1.5 text-[0.6875rem] font-medium"
                        >
                          {option.abbreviation}
                        </Badge>
                        <Badge
                          variant="outline"
                          class="text-muted-foreground h-5 shrink-0 rounded-sm px-1.5 text-[0.6875rem] font-normal"
                        >
                          {option.ectsLabel}
                        </Badge>
                      </div>
                    </div>

                    {#if option.managementLabel}
                      <span class="text-muted-foreground truncate text-xs leading-snug">
                        {option.managementLabel}
                      </span>
                    {/if}
                  </div>
                </Command.Item>
              {/each}
            </Command.Group>

            {#if hiddenOptionCount > 0}
              <div class="text-muted-foreground border-t px-3 py-2 text-xs">
                {hiddenOptionCount} weitere Ergebnisse. Suche eingrenzen, um mehr zu sehen.
              </div>
            {/if}
          {/if}
        </Command.List>
      </Command.Root>
    </Popover.Content>
  </Popover.Root>
  {#if description}
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    <Form.Description>{@html description}</Form.Description>
  {/if}
  <Form.FieldErrors />
</Form.Field>
