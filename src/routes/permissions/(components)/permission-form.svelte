<script lang="ts">
  import Combobox from '$lib/components/combobox.svelte'
  import ErrorMessage from '$lib/components/error-message.svelte'
  import type { StudyProgramFilterOption } from '$lib/components/study-program-filter'
  import { Button } from '$lib/components/ui/button/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import Spinner from '$lib/components/ui/spinner/spinner.svelte'
  import { getErrorMessage } from '$lib/errors'
  import { permissionFormSchema, permissionTypes, type Permission } from '$lib/schemas/permission'
  import { untrack } from 'svelte'
  import { superForm } from 'sveltekit-superforms'
  import { zod4Client } from 'sveltekit-superforms/adapters'
  import { createPermission, updatePermissionContext } from '../permissions.remote'
  import PermissionContextPicker from './permission-context-picker.svelte'

  interface Props {
    /** null = create, row = edit. Mounted per dialog, so the values below stay fixed. */
    item: Permission | null
    permissions: Permission[]
    people: { id: string; deLabel: string }[]
    contextOptions: StudyProgramFilterOption[]
    onClose: () => void
    onSaved: (message: string) => void
  }

  let { item, permissions, people, contextOptions, onClose, onSaved }: Props = $props()

  let saving = $state(false)
  let errorMessage = $state<string>()

  const form = superForm(
    untrack(() => {
      if (!item) return { person: '', permType: '', context: [] as string[] }
      // Contexts that are no longer offered belong to expired POs and are dropped on save.
      const available = new Set(contextOptions.map((option) => option.id))
      return {
        person: item.person.id,
        permType: item.permType.id,
        context: (item.context ?? []).filter((id) => available.has(id))
      }
    }),
    {
      SPA: true,
      validators: zod4Client(permissionFormSchema),
      resetForm: false,
      validationMethod: 'onsubmit'
    }
  )
  const { form: formData, errors, validateForm } = form

  const personOptions = $derived(
    item && !people.some((person) => person.id === item.person.id)
      ? [
          { id: item.person.id, deLabel: `${item.person.lastname}, ${item.person.firstname}` },
          ...people
        ]
      : people
  )

  const typeOptions = $derived.by(() => {
    const taken = new Set(
      permissions
        .filter((perm) => perm.person.id === $formData.person && perm.id !== item?.id)
        .map((perm) => perm.permType.id)
    )
    return permissionTypes
      .filter((type) => !taken.has(type.id))
      .map((type) => ({ id: type.id, deLabel: type.label }))
  })

  const allTypesTaken = $derived(item === null && !!$formData.person && typeOptions.length === 0)

  async function submit(event: SubmitEvent) {
    event.preventDefault()
    if (saving) return
    saving = true
    errorMessage = undefined
    try {
      const result = await validateForm()
      $errors = result.errors
      if (!result.valid) return
      if (item) {
        await updatePermissionContext({ id: item.id, context: result.data.context })
        onSaved('Die Berechtigung wurde gespeichert.')
      } else {
        await createPermission(result.data)
        onSaved('Die Berechtigung wurde angelegt.')
      }
    } catch (error) {
      errorMessage = getErrorMessage(error)
    } finally {
      saving = false
    }
  }
</script>

<Dialog.Root open={true} onOpenChange={(open) => !open && !saving && onClose()}>
  <Dialog.Content
    class="max-h-[90dvh] overflow-y-auto sm:max-w-lg"
    showClose={!saving}
    interactOutsideBehavior="ignore"
    escapeKeydownBehavior={saving ? 'ignore' : 'close'}
  >
    <Dialog.Header>
      <Dialog.Title>Berechtigung {item ? 'bearbeiten' : 'anlegen'}</Dialog.Title>
      <Dialog.Description>
        {item
          ? 'Person und Berechtigung sind fest. Nur der Kontext lässt sich ändern.'
          : 'Person, Berechtigung und optional den Kontext auswählen.'}
      </Dialog.Description>
    </Dialog.Header>

    <ErrorMessage bind:message={errorMessage} />

    <form onsubmit={submit} aria-busy={saving}>
      <fieldset disabled={saving} class="min-w-0 space-y-4">
        <Combobox
          {form}
          name="person"
          label="Person"
          placeholder="Auswählen…"
          width="w-[var(--bits-popover-anchor-width)]"
          disabled={saving || item !== null}
          options={personOptions}
          bind:value={$formData.person}
          errors={$errors}
        />
        <Combobox
          {form}
          name="permType"
          label="Berechtigung"
          placeholder="Auswählen…"
          width="w-[var(--bits-popover-anchor-width)]"
          disabled={saving || item !== null}
          options={typeOptions}
          bind:value={$formData.permType}
          errors={$errors}
        />
        {#if allTypesTaken}
          <p class="text-muted-foreground text-sm">
            Für diese Person sind bereits alle Berechtigungen vergeben.
          </p>
        {/if}
        <PermissionContextPicker
          {form}
          name="context"
          label="Kontext"
          description="Ohne Kontext gilt die Berechtigung für keine Prüfungsordnung."
          options={contextOptions}
          bind:value={$formData.context}
          disabled={saving}
        />

        <Dialog.Footer class="gap-2">
          <Button type="button" variant="outline" disabled={saving} onclick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit" disabled={saving || allTypesTaken}>
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
