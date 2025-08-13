<script lang="ts">
  import { Badge } from '$lib/components/ui/badge'
  import { buttonVariants } from '$lib/components/ui/button/index.js'
  import * as Command from '$lib/components/ui/command/index.js'
  import * as Form from '$lib/components/ui/form/index.js'
  import * as Popover from '$lib/components/ui/popover/index.js'
  import { Separator } from '$lib/components/ui/separator'
  import type { ModificationStatus } from '$lib/types/module-draft-keys'
  import { getFieldHighlightClasses } from '$lib/types/module-draft-keys'
  import { cn } from '$lib/utils.js'
  import { Check, ChevronsUpDownIcon, CirclePlus } from '@lucide/svelte'
  import ModificationIndicator from './modification-indicator.svelte'

  interface Option {
    id: string
    label: string
    abbrev?: string
  }

  interface Props {
    form: any // eslint-disable-line @typescript-eslint/no-explicit-any
    name: string // name of the field in the form
    label: string
    description: string
    options: Option[]
    value: string[]
    errors?: any // eslint-disable-line @typescript-eslint/no-explicit-any
    maxVisibleBadges?: number
    width?: string // optional width for popover content
    modificationStatus?: ModificationStatus // optional modification tracking
  }

  let {
    form,
    name,
    label,
    description,
    options,
    value = $bindable(),
    errors = {},
    maxVisibleBadges = 4,
    width = 'w-[350px]', // Default width
    modificationStatus
  }: Props = $props()

  let open = $state(false)

  function toggle(id: string) {
    const currentSelection = [...value]
    const index = currentSelection.indexOf(id)

    if (index > -1) {
      currentSelection.splice(index, 1)
    } else {
      currentSelection.push(id)
    }

    value = currentSelection
    form.validate(name)
  }

  function clear() {
    value = []
    form.validate(name)
    open = false
  }

  function getOptionBadgeLabel(id: string): string {
    const option = options.find((option) => option.id === id)
    if (!option) {
      return id
    }
    return option.abbrev ?? option.label
  }

  let displayedSelection = $derived.by(() => {
    if (value.length <= maxVisibleBadges) {
      return { badges: value, overflow: 0 }
    }
    return {
      badges: value.slice(0, maxVisibleBadges),
      overflow: value.length - maxVisibleBadges
    }
  })
</script>

{#snippet popoverContent(props: { name: string })}
  <Popover.Trigger
    role="combobox"
    class={cn(
      buttonVariants({ variant: 'outline' }),
      'h-10 w-full justify-start px-3 py-2 text-left font-normal',
      errors[name] && 'border-destructive'
    )}
    {...props}
  >
    <CirclePlus class="h-4 w-4" />
    {#if value.length > 0}
      <Separator orientation="vertical" class="mx-1 h-4" />

      <!-- Small screens: show count -->
      <Badge variant="secondary" class="rounded-sm px-1 font-normal sm:hidden">
        {value.length} Ausgewählt
      </Badge>

      <!-- Large screens: show individual badges -->
      <div class="hidden min-w-0 flex-1 space-x-1 sm:flex">
        {#each displayedSelection.badges as id (id)}
          <Badge variant="secondary" class="flex-shrink-0 rounded-sm px-1 font-normal">
            {getOptionBadgeLabel(id)}
          </Badge>
        {/each}
        {#if displayedSelection.overflow > 0}
          <Badge variant="secondary" class="flex-shrink-0 rounded-sm px-1 font-normal">
            +{displayedSelection.overflow} weitere
          </Badge>
        {/if}
      </div>
    {/if}
    <ChevronsUpDownIcon class="ml-auto h-4 w-4 shrink-0 opacity-50" />
  </Popover.Trigger>
{/snippet}

{#snippet dropdownMenu()}
  <Popover.Content class="{width} p-0" align="start">
    <Command.Root>
      <Command.Input placeholder="Suchen…" class="h-8 border-0 shadow-none focus:ring-0" />
      <Command.List>
        <Command.Empty>Keine Ergebnisse</Command.Empty>
        {#if value.length > 0}
          <Command.Separator />
          <Command.Item class="justify-center text-center" onSelect={clear}>
            Auswahl zurücksetzen
          </Command.Item>
        {/if}
        <Command.Group>
          {#each options as { id, label } (id)}
            <Command.Item value={label} onSelect={() => toggle(id)}>
              <div
                class={cn(
                  'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                  value.includes(id)
                    ? 'bg-primary text-primary-foreground'
                    : 'opacity-50 [&_svg]:invisible'
                )}
              >
                <Check class="h-4 w-4" />
              </div>
              <span>{label}</span>
            </Command.Item>
          {/each}
        </Command.Group>
      </Command.List>
    </Command.Root>
  </Popover.Content>
{/snippet}

{#if modificationStatus}
  <!-- Enhanced version with modification tracking -->
  <div class="space-y-2 {getFieldHighlightClasses(modificationStatus)}">
    <div class="flex items-center justify-between">
      <span class="text-sm font-medium text-foreground">{label}</span>
      <ModificationIndicator status={modificationStatus} iconOnly={false} inline={true} />
    </div>
    <Form.Field {form} {name}>
      <Popover.Root bind:open>
        <Form.Control>
          {#snippet children({ props })}
            {@render popoverContent(props)}
            <input hidden value={value.join(',')} name={props.name} />
          {/snippet}
        </Form.Control>
        {@render dropdownMenu()}
      </Popover.Root>
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      <Form.Description>{@html description}</Form.Description>
      <Form.FieldErrors />
    </Form.Field>
  </div>
{:else}
  <!-- Standard version without modification tracking -->
  <Form.Field {form} {name}>
    <Popover.Root bind:open>
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>{label}</Form.Label>
          {@render popoverContent(props)}
          <input hidden value={value.join(',')} name={props.name} />
        {/snippet}
      </Form.Control>
      {@render dropdownMenu()}
    </Popover.Root>
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    <Form.Description>{@html description}</Form.Description>
    <Form.FieldErrors />
  </Form.Field>
{/if}
