<script lang="ts">
  import * as Form from '$lib/components/ui/form/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'
  import type { ModificationStatus } from '$lib/types/module-draft-keys'
  import { getFieldHighlightClasses } from '$lib/types/module-draft-keys'
  import ModificationIndicator from './modification-indicator.svelte'

  interface Props {
    form: any // eslint-disable-line @typescript-eslint/no-explicit-any
    name: string
    label: string
    placeholder?: string
    description?: string
    value: string | number
    errors?: any // eslint-disable-line @typescript-eslint/no-explicit-any
    type?: 'text' | 'number' | 'email' | 'password' | 'tel' | 'url'
    step?: string
    modificationStatus?: ModificationStatus // optional modification tracking
    disabled?: boolean
  }

  let {
    form,
    name,
    label,
    placeholder = '',
    description = '',
    value = $bindable(),
    errors = {},
    type = 'text',
    step,
    modificationStatus,
    disabled = false
  }: Props = $props()
</script>

{#if modificationStatus}
  <!-- Enhanced version with modification tracking -->
  <div class="space-y-2 {getFieldHighlightClasses(modificationStatus)}">
    <div class="flex items-center justify-between">
      <span class="text-sm font-medium text-foreground">{label}</span>
      <ModificationIndicator status={modificationStatus} iconOnly={false} inline={true} />
    </div>
    <Form.Field {form} {name}>
      <Form.Control>
        {#snippet children({ props })}
          <Input
            {...props}
            {type}
            {step}
            bind:value
            {placeholder}
            class={errors[name] ? 'border-destructive' : ''}
          />
        {/snippet}
      </Form.Control>
      {#if description}
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        <Form.Description>{@html description}</Form.Description>
      {/if}
      <Form.FieldErrors />
    </Form.Field>
  </div>
{:else}
  <!-- Standard version without modification tracking -->
  <Form.Field {form} {name}>
    <Form.Control>
      {#snippet children({ props })}
        {#if disabled}
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger><Form.Label>{label}*</Form.Label></Tooltip.Trigger>
              <Tooltip.Content class="max-w-md break-words">
                Dieses Attribut kann nicht verändert werden. Falls eine Änderung dennoch
                erforderlich sein sollte, wenden Sie sich an den PAV.
              </Tooltip.Content>
            </Tooltip.Root>
          </Tooltip.Provider>
        {:else}
          <Form.Label>{label}</Form.Label>
        {/if}
        <Input
          {...props}
          {type}
          {step}
          bind:value
          {placeholder}
          {disabled}
          class={errors[name] ? 'border-destructive' : ''}
        />
      {/snippet}
    </Form.Control>
    {#if description}
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      <Form.Description>{@html description}</Form.Description>
    {/if}
    <Form.FieldErrors />
  </Form.Field>
{/if}
