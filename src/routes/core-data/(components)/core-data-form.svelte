<script lang="ts">
  import { coreDataValue } from '$lib/core-data/entities'
  import { coreDataFormSchemas, type CoreDataRow } from '$lib/schemas/core-data'
  import DatePicker from '$lib/components/date-picker.svelte'
  import Combobox from '$lib/components/combobox.svelte'
  import ErrorMessage from '$lib/components/error-message.svelte'
  import InputField from '$lib/components/input-field.svelte'
  import MultiSelectCombobox from '$lib/components/multi-select-combobox.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import * as Form from '$lib/components/ui/form/index.js'
  import Spinner from '$lib/components/ui/spinner/spinner.svelte'
  import { Switch } from '$lib/components/ui/switch/index.js'
  import { Textarea } from '$lib/components/ui/textarea/index.js'
  import type { CoreDataEntity, CoreDataField, CoreDataOption } from '$lib/core-data/entities'
  import { getErrorMessage } from '$lib/errors'
  import { tick, untrack } from 'svelte'
  import { superForm } from 'sveltekit-superforms'
  import { zod4Client } from 'sveltekit-superforms/adapters'
  import { saveCoreData } from '$lib/core-data/core-data.remote'

  interface Props {
    entity: CoreDataEntity
    /** undefined = closed, null = create, row = edit */
    item: CoreDataRow | null | undefined
    optionsByField: Map<string, CoreDataOption[]>
    onClose: () => void
    onSaved: () => void
  }

  let { entity, item, optionsByField, onClose, onSaved }: Props = $props()

  let saving = $state(false)
  let errorMessage = $state<string>()

  const emptyValue = (field: CoreDataField) =>
    field.defaultValue ??
    (field.type === 'boolean' ? false : field.type === 'multiselect' ? [] : '')

  function fieldValue(field: CoreDataField, row: CoreDataRow | null) {
    const raw = row ? coreDataValue(row, field.name) : undefined
    const fallback = emptyValue(field)
    if (field.type === 'select' || field.type === 'date') {
      if (raw == null || raw === '') return String(fallback ?? '')
      return String(raw)
    }
    return raw ?? fallback
  }

  const schema = untrack(() => coreDataFormSchemas[entity.key])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = superForm<Record<string, any>>(
    untrack(() =>
      Object.fromEntries(entity.fields.map((field) => [field.name, emptyValue(field)]))
    ),
    {
      SPA: true,
      validators: zod4Client(schema),
      resetForm: false,
      validationMethod: 'onsubmit'
    }
  )
  const { form: formData, errors, reset, validateForm } = form

  $effect.pre(() => {
    if (item === undefined) return
    const data = Object.fromEntries(
      entity.fields.map((field) => [field.name, fieldValue(field, item)])
    )
    untrack(() => reset({ data }))
    errorMessage = undefined
  })

  const visibleFields = $derived(
    entity.fields.filter(
      (field) => (item === null || field.name !== 'id') && (field.showIf?.($formData) ?? true)
    )
  )

  function optionsFor(field: CoreDataField): CoreDataOption[] {
    const options = optionsByField.get(field.name) ?? []
    if (field.name === 'kind' && item === null) {
      return options.filter((option) => option.id !== 'unknown')
    }
    return options
  }

  async function submit(event: SubmitEvent) {
    event.preventDefault()
    const formElement = event.currentTarget as HTMLFormElement
    if (saving) return
    saving = true
    errorMessage = undefined
    try {
      const result = await validateForm()
      $errors = result.errors
      if (!result.valid) {
        saving = false
        await tick()
        formElement.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
        return
      }
      await saveCoreData({ entity: entity.key, id: item?.id, data: result.data })
      onSaved()
    } catch (error) {
      errorMessage = getErrorMessage(error)
    } finally {
      saving = false
    }
  }
</script>

<Dialog.Root open={item !== undefined} onOpenChange={(open) => !open && !saving && onClose()}>
  <Dialog.Content
    class="max-h-[90dvh] overflow-y-auto sm:max-w-lg"
    showClose={!saving}
    interactOutsideBehavior="ignore"
    escapeKeydownBehavior={saving ? 'ignore' : 'close'}
  >
    <Dialog.Header>
      <Dialog.Title>{entity.singular} {item ? 'bearbeiten' : 'anlegen'}</Dialog.Title>
      {#if item}
        <Dialog.Description class="font-mono text-xs">ID: {item.id}</Dialog.Description>
      {:else}
        <Dialog.Description>Erfassen Sie die Angaben für den neuen Eintrag.</Dialog.Description>
      {/if}
    </Dialog.Header>

    <ErrorMessage bind:message={errorMessage} />

    <form onsubmit={submit} aria-busy={saving}>
      <fieldset disabled={saving} class="min-w-0 space-y-4">
        {#each visibleFields as field (field.name)}
          {@const options = optionsFor(field)}
          {#if field.type === 'select'}
            <Combobox
              {form}
              name={field.name}
              label={field.label}
              placeholder="Auswählen…"
              width="w-[var(--bits-popover-anchor-width)]"
              disabled={saving || (field.name === 'kind' && item !== null)}
              options={options.map((option) => ({ id: option.id, deLabel: option.label }))}
              bind:value={$formData[field.name]}
              errors={$errors}
            />
          {:else if field.type === 'multiselect'}
            <MultiSelectCombobox
              {form}
              name={field.name}
              label={field.label}
              width="w-[var(--bits-popover-anchor-width)]"
              maxVisibleBadges={field.maxVisibleBadges}
              disabled={saving}
              {options}
              bind:value={$formData[field.name]}
              errors={$errors}
            />
          {:else if field.type === 'date'}
            <DatePicker
              {form}
              name={field.name}
              label={field.label}
              bind:value={$formData[field.name]}
              clearable={field.clearable}
              disabled={saving}
            />
          {:else if field.type === 'textarea'}
            <Form.Field {form} name={field.name}>
              <Form.Control>
                {#snippet children({ props })}
                  <Form.Label>{field.label}</Form.Label>
                  <Textarea {...props} bind:value={$formData[field.name]} />
                {/snippet}
              </Form.Control>
              <Form.FieldErrors />
            </Form.Field>
          {:else if field.type === 'boolean'}
            <Form.Field {form} name={field.name} class="flex items-center gap-3 space-y-0">
              <Form.Control>
                {#snippet children({ props })}
                  <Switch {...props} bind:checked={$formData[field.name]} />
                  <Form.Label>{field.label}</Form.Label>
                {/snippet}
              </Form.Control>
            </Form.Field>
          {:else}
            <InputField
              {form}
              name={field.name}
              label={field.label}
              type={field.type}
              bind:value={$formData[field.name]}
              errors={$errors}
            />
          {/if}
        {/each}

        <Dialog.Footer class="gap-2">
          <Button type="button" variant="outline" disabled={saving} onclick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit" disabled={saving}>
            {#if saving}
              <Spinner size="sm" />
            {/if}
            {item ? 'Speichern' : 'Anlegen'}
          </Button>
        </Dialog.Footer>
      </fieldset>
    </form>
  </Dialog.Content>
</Dialog.Root>
