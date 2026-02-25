<script lang="ts">
  import Combobox from '$lib/components/combobox.svelte'
  import MultiSelectCombobox from '$lib/components/multi-select-combobox.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import * as Form from '$lib/components/ui/form/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import * as Table from '$lib/components/ui/table/index.js'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'
  import { moduleSchema } from '$lib/schemas/module'
  import type { AssessmentMethod, Precondition } from '$lib/types/core'
  import type { ModificationStatus } from '$lib/types/module-draft-keys'
  import { getFieldHighlightClasses } from '$lib/types/module-draft-keys'
  import type { AssessmentEntry } from '$lib/types/module-protocol'
  import { SquarePen, Plus, Trash2, TriangleAlert } from '@lucide/svelte'
  import { superForm } from 'sveltekit-superforms'
  import { zod4Client } from 'sveltekit-superforms/adapters'
  import ModificationIndicator from './modification-indicator.svelte'
  import { resolve } from '$app/paths'
  // TODO wenn zweite prüfungsform hinzugefügt wird, und die erste bereits eine prozentuale Gewichtung hat, soll die der zweiten auf die Differenz zu 100 gesetzt werden. entsprechend auch für die dritte usw.

  interface Props {
    form: any // eslint-disable-line @typescript-eslint/no-explicit-any
    name: string // name of the field in the form
    label: string
    assessmentMethods: AssessmentMethod[]
    preconditions: Precondition[]
    value: AssessmentEntry[]
    modificationStatus?: ModificationStatus // optional modification tracking
  }

  const assessmentEntrySchema = moduleSchema.shape.assessmentMethods.element

  let {
    form,
    name,
    label,
    assessmentMethods,
    preconditions,
    value = $bindable(),
    modificationStatus
  }: Props = $props()

  let dialogOpen = $state(false)
  let editingIndex = $state<number | null>(null)

  // dialog form and validation

  const dialogForm = superForm(
    {
      method: '',
      percentage: null as number | null,
      precondition: [] as string[]
    },
    {
      SPA: true,
      validators: zod4Client(assessmentEntrySchema),
      resetForm: false
    }
  )

  const { form: dialogFormData, errors: dialogErrors, reset, validate } = dialogForm

  const isDialogFormValid = $derived.by(() => {
    const errors = $dialogErrors
    return (
      !Object.keys(errors).some((k) => errors[k as keyof typeof errors]) &&
      $dialogFormData.method !== ''
    )
  })

  async function handleSubmit() {
    const methodValid = await validate('method')
    const percentageValid = await validate('percentage')

    if (methodValid === undefined && percentageValid === undefined) {
      saveEntry($dialogFormData)
      dialogOpen = false
    }
  }

  // dialog handling

  function openAddDialog() {
    editingIndex = null
    reset({
      data: {
        method: '',
        percentage: null,
        precondition: []
      }
    })
    dialogOpen = true
  }

  function openEditDialog(index: number) {
    editingIndex = index
    const { method, percentage, precondition } = value[index]
    reset({
      data: { method, percentage, precondition }
    })
    dialogOpen = true
  }

  // form options

  const assessmentMethodOptions = $derived.by(() => {
    const current = value

    if (editingIndex === null) {
      // create new entry
      return assessmentMethods
        .filter(({ id, isRPO }) => isRPO && !current.some(({ method }) => method === id))
        .map(({ id, deLabel }) => ({ id, deLabel }))
    }

    const currentMethod = current[editingIndex].method
    return assessmentMethods
      .filter(
        ({ id, isRPO }) =>
          (isRPO && !current.some(({ method }) => method === id)) || id === currentMethod
      )
      .map(({ id, deLabel }) => ({ id, deLabel }))
  })

  const preconditionOptions = $derived(preconditions.map(({ id, label }) => ({ id, label })))

  // updates

  function saveEntry(data: typeof $dialogFormData) {
    const newEntry: AssessmentEntry = {
      method: data.method,
      percentage: data.percentage,
      precondition: data.precondition
    }

    if (editingIndex !== null) {
      value = value.map((item, i) => (i === editingIndex ? newEntry : item))
    } else {
      value = [...value, newEntry]
    }

    form.validate(name)
  }

  function deleteEntry(index: number) {
    value = value.filter((_, i) => i !== index)
    form.validate(name)
  }

  // table rendering

  function showAssessmentMethod(id: string) {
    return assessmentMethods.find((a) => a.id === id)?.deLabel ?? id
  }

  function showPreconditions(xs: string[]) {
    let res = ''
    let i = 0
    for (const id of xs) {
      const p = preconditions.find((p) => p.id === id)
      if (p) {
        res += p.label
        if (i < xs.length - 1) {
          res += ', '
        }
        i++
      }
    }
    return res
  }

  function isRPO(id: string) {
    return assessmentMethods.find((a) => a.id === id)?.isRPO ?? false
  }
</script>

{#snippet assessmentContent(props: { name: string })}
  <div class="space-y-6">
    {#if value.length > 0}
      <div class="space-y-4">
        <!-- Add Button -->
        <Button type="button" variant="outline" onclick={openAddDialog} class="w-full sm:w-auto">
          <Plus class="mr-2 size-4" />
          Prüfungsform hinzufügen
        </Button>

        <!-- Assessment Methods Table -->
        <div class="rounded-md border">
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.Head>Prüfungsform</Table.Head>
                <Table.Head>Prozentuale Gewichtung</Table.Head>
                <Table.Head>Voraussetzung</Table.Head>
                <Table.Head class="w-24">Aktionen</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {#each value as entry, index (entry.method)}
                <Table.Row>
                  <Table.Cell class="font-medium">
                    {#if isRPO(entry.method)}
                      {showAssessmentMethod(entry.method)}
                    {:else}
                      <Tooltip.Provider>
                        <Tooltip.Root>
                          <Tooltip.Trigger>
                            <div class="flex items-center">
                              <TriangleAlert class="mr-2 size-4 shrink-0 text-red-500" />
                              <span>{showAssessmentMethod(entry.method)}</span>
                            </div>
                          </Tooltip.Trigger>
                          <Tooltip.Content class="max-w-md wrap-break-word">
                            Die Prüfungsform ist nicht in der Rahmenprüfungsordnung enthalten und
                            sollte nicht verwendet werden.
                          </Tooltip.Content>
                        </Tooltip.Root>
                      </Tooltip.Provider>
                    {/if}
                  </Table.Cell>
                  <Table.Cell>
                    {entry.percentage !== null ? `${entry.percentage} %` : '-'}
                  </Table.Cell>
                  <Table.Cell>
                    {entry.precondition.length > 0 ? showPreconditions(entry.precondition) : '-'}
                  </Table.Cell>
                  <Table.Cell>
                    <div class="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        class="text-blue-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800"
                        onclick={() => openEditDialog(index)}
                      >
                        <SquarePen class="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        class="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onclick={() => deleteEntry(index)}
                      >
                        <Trash2 class="size-4" />
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              {/each}
            </Table.Body>
          </Table.Root>
        </div>
      </div>
    {:else}
      <div class="border-muted-foreground/25 bg-muted/10 rounded-md border border-dashed">
        <div class="flex flex-col items-center justify-center px-6 py-8 text-center">
          <div class="bg-muted mb-3 rounded-full p-3">
            <svg
              class="text-muted-foreground size-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 class="text-foreground mb-2 text-base font-medium">Keine Prüfungsformen definiert</h3>
          <p class="text-muted-foreground mb-4 max-w-sm text-sm">
            Es wurden noch keine Prüfungsformen für dieses Modul festgelegt.
          </p>
          <Button type="button" variant="outline" onclick={openAddDialog}>
            <Plus class="mr-2 size-4" />
            Prüfungsform hinzufügen
          </Button>
        </div>
      </div>
    {/if}
  </div>

  <!-- Hidden input for form integration -->
  <input hidden value={JSON.stringify(value)} name={props.name} />
{/snippet}

{#if modificationStatus}
  <!-- Enhanced version with modification tracking -->
  <div class="space-y-2 {getFieldHighlightClasses(modificationStatus)}">
    <div class="flex items-center justify-between">
      <span class="text-foreground text-base font-medium">{label}</span>
      <ModificationIndicator status={modificationStatus} iconOnly={false} inline={true} />
    </div>
    <p class="text-muted-foreground text-sm">
      Hier werden Prüfungsformen festgelegt, die im kommenden Semester für das Modul gelten.
    </p>
    <Form.Field {form} {name}>
      <Form.Control>
        {#snippet children({ props })}
          {@render assessmentContent(props)}
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
      <Form.Description class="mt-4">
        Änderungen an den Prüfungsformen müssen vom <a
          href="/help#review-process"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary underline hover:no-underline">PAV geprüft</a
        >
        werden. Zudem dürfen nur valide Prüfungsformen gemäß der
        <a
          href={resolve('/assessment-methods')}
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary underline hover:no-underline">Rahmenprüfungsordnung (RPO)</a
        > gewählt werden. Bei mehreren Prüfungsformen bietet es sich an, die prozentuale Aufteilung aufzuschlüsseln.
      </Form.Description>
    </Form.Field>
  </div>
{:else}
  <!-- Standard version without modification tracking -->
  <Form.Field {form} {name}>
    <Form.Control>
      {#snippet children({ props })}
        <div class="space-y-4">
          <div class="border-b pb-2">
            <Form.Label class="text-foreground text-base font-medium">{label}</Form.Label>
            <Form.Description class="text-muted-foreground mt-1 text-sm">
              Hier werden Prüfungsformen festgelegt, die im kommenden Semester für das Modul gelten.
            </Form.Description>
          </div>
        </div>
        {@render assessmentContent(props)}
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
    <Form.Description class="mt-4">
      Änderungen an den Prüfungsformen müssen vom <a
        href="/help#review-process"
        target="_blank"
        rel="noopener noreferrer"
        class="text-primary underline hover:no-underline">PAV geprüft</a
      >
      werden. Zudem dürfen nur valide Prüfungsformen gemäß der
      <a
        href={resolve('/assessment-methods')}
        target="_blank"
        rel="noopener noreferrer"
        class="text-primary underline hover:no-underline">Rahmenprüfungsordnung (RPO)</a
      > gewählt werden. Bei mehreren Prüfungsformen bietet es sich an, die prozentuale Aufteilung aufzuschlüsseln.
    </Form.Description>
  </Form.Field>
{/if}

<!-- Add/Edit Dialog -->
<Dialog.Root bind:open={dialogOpen}>
  <Dialog.Content class="max-w-lg">
    <Dialog.Header>
      <Dialog.Title>
        {editingIndex !== null ? 'Prüfungsform bearbeiten' : 'Prüfungsform hinzufügen'}
      </Dialog.Title>
    </Dialog.Header>

    <div class="space-y-4 py-4">
      <!-- Assessment Method Selection -->
      <Combobox
        form={dialogForm}
        name="method"
        label="Prüfungsform"
        placeholder="Prüfungsform auswählen…"
        description="Wählen Sie eine gültige Prüfungsform aus der Rahmenprüfungsordnung."
        options={assessmentMethodOptions}
        bind:value={$dialogFormData.method}
        errors={$dialogErrors}
      />

      <!-- Percentage Input -->
      <Form.Field form={dialogForm} name="percentage">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>Prozentsatz (optional)</Form.Label>
            <Input
              type="number"
              min="1"
              max="100"
              {...props}
              bind:value={$dialogFormData.percentage}
              placeholder="z.B. 50"
              class={$dialogErrors.percentage ? 'border-destructive' : ''}
            />
          {/snippet}
        </Form.Control>
        <Form.Description>Prozentuale Gewichtung bei mehreren Prüfungsformen</Form.Description>
        <Form.FieldErrors />
      </Form.Field>

      <!-- Precondition Selection -->
      {#if editingIndex !== null}
        <MultiSelectCombobox
          form={dialogForm}
          name="precondition"
          label="Voraussetzungen (optional)"
          description="Prüfungsvoraussetzungen laut Prüfungsordnung. z.B. Praktikum."
          options={preconditionOptions}
          bind:value={$dialogFormData.precondition}
          errors={$dialogErrors}
        />
      {/if}
    </div>

    <Dialog.Footer class="gap-2">
      <Button type="button" variant="outline" onclick={() => (dialogOpen = false)}>
        Abbrechen
      </Button>
      <Button type="button" disabled={!isDialogFormValid} onclick={handleSubmit}>
        {editingIndex !== null ? 'Änderungen speichern' : 'Hinzufügen'}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
