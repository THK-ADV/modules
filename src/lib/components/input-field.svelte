<script lang="ts">
  import * as Form from '$lib/components/ui/form/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import type { ModificationStatus } from '$lib/types/module-draft-keys'
  import { getFieldHighlightClasses } from '$lib/types/module-draft-keys'
  import ModificationIndicator from './modification-indicator.svelte'

  interface Props {
    form: any
    name: string
    label: string
    placeholder?: string
    description?: string
    value: string | number
    errors?: any
    type?: 'text' | 'number' | 'email' | 'password' | 'tel' | 'url'
    step?: string
    modificationStatus?: ModificationStatus // optional modification tracking
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
    modificationStatus
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
        <Form.Label>{label}</Form.Label>
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
      <Form.Description>{@html description}</Form.Description>
    {/if}
    <Form.FieldErrors />
  </Form.Field>
{/if}
