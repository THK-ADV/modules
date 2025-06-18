<script lang="ts">
  import { buttonVariants } from '$lib/components/ui/button/index.js'
  import * as Command from '$lib/components/ui/command/index.js'
  import * as Form from '$lib/components/ui/form/index.js'
  import * as Popover from '$lib/components/ui/popover/index.js'
  import type { ModificationStatus } from '$lib/types/module-draft-keys'
  import { getFieldHighlightClasses } from '$lib/types/module-draft-keys'
  import { cn } from '$lib/utils.js'
  import { Check, ChevronsUpDownIcon } from '@lucide/svelte'
  import ModificationIndicator from './modification-indicator.svelte'

  interface Option {
    id: string
    deLabel: string
  }

  interface Props {
    form: any
    name: string
    label: string
    placeholder: string
    description: string
    options: Option[]
    value: string
    errors?: any
    width?: string // optional width for popover content
    modificationStatus?: ModificationStatus // optional modification tracking
  }

  let {
    form,
    name, // name of the field in the form
    label,
    placeholder,
    description,
    options,
    value = $bindable(),
    errors = {},
    width = 'w-[350px]', // Default width
    modificationStatus
  }: Props = $props()

  let open = $state(false)

  function onSelect(id: string) {
    value = id
    form.validate(name)
    open = false
  }
</script>

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
            <Popover.Trigger
              role="combobox"
              class={cn(
                buttonVariants({ variant: 'outline' }),
                'h-10 w-full justify-between px-3 py-2 text-left font-normal',
                !value && 'text-muted-foreground',
                errors[name] && 'border-destructive'
              )}
              {...props}
            >
              {options.find(({ id }) => id === value)?.deLabel || placeholder}
              <ChevronsUpDownIcon class="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Popover.Trigger>
            <input hidden {value} name={props.name} />
          {/snippet}
        </Form.Control>
        <Popover.Content class="{width} p-0" align="start">
          <Command.Root>
            <Command.Input placeholder="Suchen…" class="h-8 border-0 shadow-none focus:ring-0" />
            <Command.List>
              <Command.Empty>Keine Ergebnisse</Command.Empty>
              <Command.Group>
                {#each options as { id, deLabel } (id)}
                  <Command.Item value={deLabel} onSelect={() => onSelect(id)}>
                    <Check class={cn('mr-2 h-4 w-4', id === value ? 'opacity-100' : 'opacity-0')} />
                    <span>{deLabel}</span>
                  </Command.Item>
                {/each}
              </Command.Group>
            </Command.List>
          </Command.Root>
        </Popover.Content>
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
          <Popover.Trigger
            role="combobox"
            class={cn(
              buttonVariants({ variant: 'outline' }),
              'h-10 w-full justify-between px-3 py-2 text-left font-normal',
              !value && 'text-muted-foreground',
              errors[name] && 'border-destructive'
            )}
            {...props}
          >
            {options.find(({ id }) => id === value)?.deLabel || placeholder}
            <ChevronsUpDownIcon class="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Popover.Trigger>
          <input hidden {value} name={props.name} />
        {/snippet}
      </Form.Control>
      <Popover.Content class="{width} p-0" align="start">
        <Command.Root>
          <Command.Input placeholder="Suchen…" class="h-8 border-0 shadow-none focus:ring-0" />
          <Command.List>
            <Command.Empty>Keine Ergebnisse</Command.Empty>
            <Command.Group>
              {#each options as { id, deLabel } (id)}
                <Command.Item value={deLabel} onSelect={() => onSelect(id)}>
                  <Check class={cn('mr-2 h-4 w-4', id === value ? 'opacity-100' : 'opacity-0')} />
                  <span>{deLabel}</span>
                </Command.Item>
              {/each}
            </Command.Group>
          </Command.List>
        </Command.Root>
      </Popover.Content>
    </Popover.Root>
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    <Form.Description>{@html description}</Form.Description>
    <Form.FieldErrors />
  </Form.Field>
{/if}
