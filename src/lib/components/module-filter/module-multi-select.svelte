<script lang="ts">
  import { Badge } from '$lib/components/ui/badge'
  import { buttonVariants } from '$lib/components/ui/button'
  import * as Command from '$lib/components/ui/command'
  import * as Form from '$lib/components/ui/form'
  import * as Popover from '$lib/components/ui/popover'
  import { Separator } from '$lib/components/ui/separator'
  import type { ModificationStatus } from '$lib/types/module-draft-keys'
  import { getFieldHighlightClasses } from '$lib/types/module-draft-keys'
  import { cn } from '$lib/utils.js'
  import { Check, CirclePlus } from '@lucide/svelte'
  import ModificationIndicator from '../modification-indicator.svelte'
  import type { ModuleFilterOption } from './types'

  // Same large-list pattern as ModuleSingleSelect: cap mounted Command items.
  const MAX_RENDERED_OPTIONS = 80

  interface CommonProps {
    label: string
    description?: string
    options: ModuleFilterOption[]
    value: string[]
    maxVisibleBadges?: number
    width?: string
    disabled?: boolean
  }

  type FormProps = CommonProps & {
    form: any // eslint-disable-line @typescript-eslint/no-explicit-any
    name: string
    errors?: any // eslint-disable-line @typescript-eslint/no-explicit-any
    modificationStatus?: ModificationStatus
    handleSelect?: never
    clearFilters?: never
  }

  type FilterProps = CommonProps & {
    form?: never
    name?: never
    errors?: never
    modificationStatus?: never
    handleSelect: (id: string) => void
    clearFilters: () => void
  }

  type Props = FormProps | FilterProps

  let {
    form,
    name,
    label,
    description,
    options,
    value = $bindable(),
    errors = {},
    maxVisibleBadges = 4,
    width = 'w-[min(100vw-1.5rem,560px)]',
    modificationStatus,
    disabled = false,
    handleSelect,
    clearFilters
  }: Props = $props()

  let open = $state(false)
  let search = $state('')

  const mode = $derived.by(() => {
    assertValidMode({ form, name, handleSelect, clearFilters })
    return form !== undefined && form !== null ? 'form' : 'filter'
  })
  const hasFormField = $derived(mode === 'form')
  const fieldName = $derived(name ?? '')
  const hasActiveSelection = $derived(value.length > 0)

  const optionById = $derived.by(() => new Map(options.map((option) => [option.id, option])))
  const selectedSet = $derived(new Set(value))

  // Search input is normalized once here; option.searchText is precomputed in the option model.
  const searchTerms = $derived(
    search
      .trim()
      .toLocaleLowerCase('de-DE')
      .split(/\s+/)
      .filter((term) => term.length > 0)
  )

  // Manual filtering keeps Command from scoring/sorting every module on each keystroke.
  const filteredOptions = $derived.by(() => {
    const matched =
      searchTerms.length === 0
        ? options
        : options.filter((option) => searchTerms.every((term) => option.searchText.includes(term)))

    if (selectedSet.size === 0) {
      return matched
    }

    const selected: ModuleFilterOption[] = []
    const unselected: ModuleFilterOption[] = []
    for (const option of matched) {
      if (selectedSet.has(option.id)) {
        selected.push(option)
      } else {
        unselected.push(option)
      }
    }
    return [...selected, ...unselected]
  })

  const visibleOptions = $derived(filteredOptions.slice(0, MAX_RENDERED_OPTIONS))

  // The count communicates that the result set is intentionally capped, not incomplete.
  const hiddenOptionCount = $derived(Math.max(filteredOptions.length - visibleOptions.length, 0))

  const displayedSelection = $derived.by(() => {
    if (value.length <= maxVisibleBadges) {
      return { ids: value, overflow: 0 }
    }
    return {
      ids: value.slice(0, maxVisibleBadges),
      overflow: value.length - maxVisibleBadges
    }
  })

  const triggerButtonClass = $derived(
    cn(
      'h-8 border-2 transition-[color,box-shadow,background-color,border-color] duration-200',
      !hasActiveSelection && 'border-dashed',
      hasActiveSelection && [
        'border-solid border-primary/28 hover:border-primary/35 dark:border-primary/55',
        'bg-primary/5 hover:bg-primary/10 dark:bg-primary/15 dark:hover:bg-primary/22'
      ]
    )
  )

  function validate() {
    if (hasFormField) {
      form.validate(fieldName)
    }
  }

  function setValue(nextValue: string[]) {
    value = nextValue
    validate()
  }

  function toggle(id: string) {
    if (disabled) return

    if (handleSelect) {
      handleSelect(id)
      validate()
      return
    }

    const currentSelection = [...value]
    const index = currentSelection.indexOf(id)

    if (index > -1) {
      currentSelection.splice(index, 1)
    } else {
      currentSelection.push(id)
    }

    setValue(currentSelection)
  }

  function clear() {
    if (disabled) return

    if (clearFilters) {
      clearFilters()
      validate()
    } else {
      setValue([])
    }
    search = ''
    open = false
  }

  function handleOpenChange(nextOpen: boolean) {
    open = nextOpen
    if (!nextOpen) {
      search = ''
    }
  }

  function getOptionBadgeLabel(id: string): string {
    return optionById.get(id)?.abbreviation ?? id
  }

  function assertValidMode({
    form,
    name,
    handleSelect,
    clearFilters
  }: {
    form: unknown
    name: unknown
    handleSelect: unknown
    clearFilters: unknown
  }) {
    if (form === null || name === null) {
      throw new Error('ModuleMultiSelect: form and name must not be null.')
    }

    const hasForm = form !== undefined && form !== null
    const hasName = name !== undefined && name !== null
    const hasHandleSelect = handleSelect !== undefined
    const hasClearFilters = clearFilters !== undefined

    if (hasForm !== hasName) {
      throw new Error('ModuleMultiSelect: form and name must be provided together.')
    }

    if (hasName && (typeof name !== 'string' || name.length === 0)) {
      throw new Error('ModuleMultiSelect: name must be a non-empty string.')
    }

    if (hasForm && (hasHandleSelect || hasClearFilters)) {
      throw new Error('ModuleMultiSelect: form mode cannot use filter callbacks.')
    }

    if (!hasForm && (!hasHandleSelect || !hasClearFilters)) {
      throw new Error(
        'ModuleMultiSelect: filter mode requires handleSelect and clearFilters callbacks.'
      )
    }
  }
</script>

{#snippet triggerContent()}
  <CirclePlus class="size-4" />
  {label}
  {#if value.length > 0}
    <Separator orientation="vertical" class="mx-1 h-4" />
    <Badge variant="secondary" class="rounded-sm px-1 font-normal sm:hidden">
      {value.length} Ausgewählt
    </Badge>
    <div class="hidden min-w-0 flex-1 space-x-1 sm:flex">
      {#each displayedSelection.ids as id (id)}
        <Badge variant="secondary" class="shrink-0 rounded-sm px-1 font-normal">
          {getOptionBadgeLabel(id)}
        </Badge>
      {/each}
      {#if displayedSelection.overflow > 0}
        <Badge variant="secondary" class="shrink-0 rounded-sm px-1 font-normal">
          +{displayedSelection.overflow} weitere
        </Badge>
      {/if}
    </div>
  {/if}
{/snippet}

{#snippet dropdownMenu()}
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
        {#if value.length > 0}
          <Command.Item class="justify-center text-center" onSelect={clear}>
            Auswahl zurücksetzen
          </Command.Item>
          <Command.Separator />
        {/if}

        {#if visibleOptions.length === 0}
          <div class="text-muted-foreground py-6 text-center text-sm">Keine Ergebnisse</div>
        {:else}
          <Command.Group>
            {#each visibleOptions as option (option.id)}
              <Command.Item
                value={option.id}
                class="items-start gap-2 py-2 pr-2"
                onSelect={() => toggle(option.id)}
                {disabled}
              >
                <div
                  class={cn(
                    'border-primary mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-sm border',
                    selectedSet.has(option.id)
                      ? 'bg-primary text-primary-foreground'
                      : 'opacity-50 [&_svg]:invisible'
                  )}
                >
                  <Check class="size-4" />
                </div>

                <div class="flex min-w-0 flex-1 flex-col gap-1">
                  <div
                    class="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                  >
                    <span class="min-w-0 text-sm leading-snug font-medium wrap-break-word">
                      {option.label}
                    </span>

                    <div class="flex shrink-0 flex-wrap items-center gap-1 sm:justify-end sm:pl-1">
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
{/snippet}

{#if hasFormField}
  {#if modificationStatus}
    <div class="space-y-2 {getFieldHighlightClasses(modificationStatus)}">
      <div class="flex items-center justify-between">
        <span class="text-foreground text-sm font-medium">{label}</span>
        <ModificationIndicator status={modificationStatus} iconOnly={false} inline={true} />
      </div>
      <Form.Field {form} name={fieldName}>
        <Popover.Root bind:open onOpenChange={handleOpenChange}>
          <Form.Control>
            {#snippet children({ props })}
              <Popover.Trigger
                {...props}
                role="combobox"
                {disabled}
                class={cn(
                  buttonVariants({ variant: 'outline' }),
                  'h-10 w-full justify-start px-3 py-2 text-left font-normal',
                  errors[fieldName] && 'border-destructive',
                  disabled && 'cursor-not-allowed opacity-50'
                )}
              >
                {@render triggerContent()}
              </Popover.Trigger>
              <input hidden value={value.join(',')} name={props.name} />
            {/snippet}
          </Form.Control>
          {@render dropdownMenu()}
        </Popover.Root>
        {#if description}
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          <Form.Description>{@html description}</Form.Description>
        {/if}
        <Form.FieldErrors />
      </Form.Field>
    </div>
  {:else}
    <Form.Field {form} name={fieldName}>
      <Popover.Root bind:open onOpenChange={handleOpenChange}>
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>{label}</Form.Label>
            <Popover.Trigger
              {...props}
              role="combobox"
              {disabled}
              class={cn(
                buttonVariants({ variant: 'outline' }),
                'h-10 w-full justify-start px-3 py-2 text-left font-normal',
                errors[fieldName] && 'border-destructive',
                disabled && 'cursor-not-allowed opacity-50'
              )}
            >
              {@render triggerContent()}
            </Popover.Trigger>
            <input hidden value={value.join(',')} name={props.name} />
          {/snippet}
        </Form.Control>
        {@render dropdownMenu()}
      </Popover.Root>
      {#if description}
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        <Form.Description>{@html description}</Form.Description>
      {/if}
      <Form.FieldErrors />
    </Form.Field>
  {/if}
{:else}
  <Popover.Root bind:open onOpenChange={handleOpenChange}>
    <Popover.Trigger
      type="button"
      class={cn(buttonVariants({ variant: 'outline', size: 'sm' }), triggerButtonClass)}
      {disabled}
    >
      {@render triggerContent()}
    </Popover.Trigger>
    {@render dropdownMenu()}
  </Popover.Root>
{/if}
