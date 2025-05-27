<script lang="ts" module>
  interface Props {
    form: any
    name: string // name of the field in the form
    label: string
    assessmentMethods: AssessmentMethod[]
    preconditions: Precondition[]
    value: AssessmentEntry[]
    errors?: any
  }
</script>

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
  import type { AssessmentEntry } from '$lib/types/module-protocol'
  import { Edit, Plus, Trash2, TriangleAlert } from '@lucide/svelte'
  import { superForm } from 'sveltekit-superforms'
  import { zodClient } from 'sveltekit-superforms/adapters'

  const assessmentEntrySchema = moduleSchema.innerType().shape.assessmentMethods.element

  // TODO wenn zweite prüfungsform hinzugefügt wird, und die erste bereits eine prozentuale gewichtung hat, soll die der zweiten auf die differenz zu 100 gesetzt werden. entsprechend auch für die dritte usw.

  let {
    form,
    name,
    label,
    assessmentMethods,
    preconditions,
    value = $bindable(),
    errors = {}
  }: Props = $props()

  let dialogOpen = $state(false)
  let editingIndex = $state<number | null>(null)

  const dialogForm = superForm(
    {
      method: '',
      percentage: null as number | null,
      precondition: [] as string[]
    },
    {
      SPA: true,
      validators: zodClient(assessmentEntrySchema),
      resetForm: false
    }
  )

  const { form: dialogFormData, errors: dialogErrors, reset, validate } = dialogForm

  const assessmentMethodOptions = $derived.by(() => {
    const current = value

    if (editingIndex === null) {
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

  const preconditionOptions = preconditions.map(({ id, label }) => ({ id, label }))

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

  function saveEntry(data: typeof $dialogFormData) {
    const newEntry: AssessmentEntry = {
      method: data.method,
      percentage: data.percentage,
      precondition: data.precondition
    }

    if (editingIndex !== null) {
      value[editingIndex] = newEntry
    } else {
      value = [...value, newEntry]
    }

    form.validate(name)
  }

  function deleteEntry(index: number) {
    value = value.filter((_, i) => i !== index)
    form.validate(name)
  }

  function getMethodLabel(id: string) {
    return assessmentMethods.find((a) => a.id === id)?.deLabel ?? id
  }

  function isRPO(id: string) {
    return assessmentMethods.find((a) => a.id === id)?.isRPO ?? false
  }

  function preconditionLabel(xs: string[]) {
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

  function handleMethodSelect(id: string) {
    $dialogFormData.method = id
  }

  function handlePreconditionSelect(ids: string[]) {
    $dialogFormData.precondition = ids
  }
</script>

<Form.Field {form} {name}>
  <Form.Control>
    {#snippet children({ props })}
      <Form.Label>{label}</Form.Label>
      <Form.Description
        >Hier werden Prüfungsformen festgelegt, die im kommenden Semester für das Modul gelten.</Form.Description
      >

      <div class="space-y-4">
        <!-- Add Button -->
        <Button type="button" variant="outline" onclick={openAddDialog} class="w-full sm:w-auto">
          <Plus class="mr-2 h-4 w-4" />
          Prüfungsform hinzufügen
        </Button>

        <!-- Assessment Methods Table -->
        {#if value.length > 0}
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
                        {getMethodLabel(entry.method)}
                      {:else}
                        <Tooltip.Provider>
                          <Tooltip.Root>
                            <Tooltip.Trigger>
                              <div class="flex items-center">
                                <TriangleAlert class="mr-2 h-4 w-4 flex-shrink-0 text-red-500" />
                                <span>{getMethodLabel(entry.method)}</span>
                              </div>
                            </Tooltip.Trigger>
                            <Tooltip.Content class="max-w-md break-words">
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
                      {entry.precondition.length > 0 ? preconditionLabel(entry.precondition) : '-'}
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
                          <Edit class="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          class="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onclick={() => deleteEntry(index)}
                        >
                          <Trash2 class="h-4 w-4" />
                        </Button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                {/each}
              </Table.Body>
            </Table.Root>
          </div>
        {/if}
      </div>

      <!-- Hidden input for form integration -->
      <input hidden value={JSON.stringify(value)} name={props.name} />
    {/snippet}
  </Form.Control>

  <Form.FieldErrors />

  <Form.Description>
    Änderungen an den Prüfungsformen müssen vom <a
      href="/help/approval"
      class="text-primary underline hover:no-underline">PAV geprüft</a
    >
    werden. werden. Zudem dürfen nur valide Prüfungsformen gemäß der
    <a href="/help/assessment-methods" class="text-primary underline hover:no-underline"
      >Rahmenprüfungsordnung (RPO)</a
    > gewählt werden. Bei mehreren Prüfungsformen bietet es sich an, die prozentuale Aufteilung aufzuschlüsseln.</Form.Description
  >

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
          onSelect={handleMethodSelect}
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
        <MultiSelectCombobox
          form={dialogForm}
          name="precondition"
          label="Voraussetzungen (optional)"
          placeholder="Voraussetzungen suchen…"
          description="Prüfungsvoraussetzungen laut Prüfungsordnung. z.B. Praktikum."
          options={preconditionOptions}
          bind:value={$dialogFormData.precondition}
          onSelect={handlePreconditionSelect}
          errors={$dialogErrors}
        />

        <Dialog.Footer class="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onclick={() => (dialogOpen = false)}>
            Abbrechen
          </Button>
          <Button type="button" disabled={!isDialogFormValid} onclick={handleSubmit}>
            {editingIndex !== null ? 'Änderungen speichern' : 'Hinzufügen'}
          </Button>
        </Dialog.Footer>
      </div>
    </Dialog.Content>
  </Dialog.Root>
</Form.Field>
