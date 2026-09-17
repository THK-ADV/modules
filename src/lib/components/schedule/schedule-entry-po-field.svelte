<script lang="ts">
  import { Badge } from '$lib/components/ui/badge'
  import { Button } from '$lib/components/ui/button/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import * as Form from '$lib/components/ui/form/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import { Switch } from '$lib/components/ui/switch/index.js'
  import * as Table from '$lib/components/ui/table/index.js'
  import { fmtStudyProgram } from '$lib/formats'
  import { scheduleEntryPoFormSchema } from '$lib/schemas/schedule'
  import { mergePOs, type PO } from '$lib/types/schedule'
  import { getFullPOId, type StudyProgram } from '$lib/types/study-program'
  import { Plus, SquarePen, Trash2 } from '@lucide/svelte'
  import { superForm } from 'sveltekit-superforms'
  import { zod4 } from 'sveltekit-superforms/adapters'
  import Combobox from '../combobox.svelte'
  import { createSemesterOptions, showPO, showRecommendedSemester } from '../forms/forms'
  import MultiSelectCombobox from '../multi-select-combobox.svelte'

  interface Props {
    form: any // eslint-disable-line @typescript-eslint/no-explicit-any
    /** Bound to the `pos` field of the parent form */
    value: PO[]
    studyPrograms: StudyProgram[]
    /** Whether the add/edit sub-dialog is open; parents use it to suppress shortcuts */
    subDialogOpen?: boolean
  }

  let {
    form,
    value = $bindable(),
    studyPrograms,
    subDialogOpen = $bindable(false)
  }: Props = $props()

  function deletePO(index: number) {
    value = value.filter((_, i) => i !== index)
    void updatePOErrors()
  }

  async function updatePOErrors() {
    const validation = await form.validateForm()
    form.errors.update((currentErrors: Record<string, unknown>) => ({
      ...currentErrors,
      pos: validation.errors.pos
    }))
  }

  let poEditingIndex = $state<number | null>(null)

  const poDialogForm = superForm(
    {
      fullPOId: '',
      recommendedSemester: [] as number[],
      mandatory: false
    },
    {
      SPA: true,
      dataType: 'json',
      validators: zod4(scheduleEntryPoFormSchema),
      resetForm: false
    }
  )

  const {
    form: poDialogFormData,
    errors: poDialogErrors,
    reset: resetPODialog,
    validate: validatePODialog
  } = poDialogForm

  const semesterOptions = createSemesterOptions()

  let poRecommendedSemester = {
    get value() {
      return $poDialogFormData.recommendedSemester.map((s) => s.toString())
    },
    set value(newValue: string[]) {
      $poDialogFormData.recommendedSemester = newValue.map((s) => +s)
    }
  }

  const studyProgramOptions = $derived.by(() => {
    const currentPO = poEditingIndex !== null ? value[poEditingIndex] : null

    return studyPrograms
      .filter((sp) => {
        const fullPOId = getFullPOId(sp)
        const isAlreadyUsed = value.some(
          ({ specialization, po }) => (specialization ?? po) === fullPOId
        )
        // allow if not used, or if editing and this is the current PO
        return !isAlreadyUsed || fullPOId === (currentPO?.specialization ?? currentPO?.po)
      })
      .map((sp) => ({
        id: getFullPOId(sp),
        deLabel: fmtStudyProgram(sp)
      }))
  })

  const showPOEntry = $derived(showPO(studyPrograms))

  function openAddPODialog() {
    poEditingIndex = null
    resetPODialog({
      data: { fullPOId: '', recommendedSemester: [], mandatory: false }
    })
    subDialogOpen = true
  }

  function openEditPODialog(index: number) {
    poEditingIndex = index
    const entry = value[index]

    resetPODialog({
      data: {
        fullPOId: entry.specialization ?? entry.po,
        recommendedSemester: [...entry.recommendedSemester],
        mandatory: entry.mandatory
      }
    })
    subDialogOpen = true
  }

  async function handlePODialogSave() {
    const poValid = await validatePODialog('fullPOId')

    if (poValid === undefined) {
      const sp = studyPrograms.find((sp) => getFullPOId(sp) === $poDialogFormData.fullPOId)

      if (!sp) {
        console.error(`Study program not found for ID: ${$poDialogFormData.fullPOId}`)
        return
      }

      let newEntry: PO
      if (sp?.specialization?.id) {
        // since the fullPOId is saved in the form, we need to get the po and specialization from the associated study program
        newEntry = {
          po: sp.po.id,
          specialization: sp.specialization.id,
          recommendedSemester: [...$poDialogFormData.recommendedSemester],
          mandatory: $poDialogFormData.mandatory
        }
      } else {
        newEntry = {
          po: $poDialogFormData.fullPOId,
          specialization: null,
          recommendedSemester: [...$poDialogFormData.recommendedSemester],
          mandatory: $poDialogFormData.mandatory
        }
      }

      value = mergePOs(
        poEditingIndex !== null
          ? value.map((item, i) => (i === poEditingIndex ? newEntry : item))
          : [...value, newEntry]
      )

      void updatePOErrors()
      subDialogOpen = false
    }
  }
</script>

<Form.Field {form} name="pos">
  <Form.Control>
    {#snippet children({ props })}
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <Form.Label class="text-sm font-medium">Studiengänge und PO-Beziehungen</Form.Label>
          <Button type="button" variant="outline" size="sm" onclick={openAddPODialog}>
            <Plus class="size-4" />
            Hinzufügen
          </Button>
        </div>

        {#if value.length > 0}
          <div class="rounded-md border">
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Studiengang und PO</Table.Head>
                  <Table.Head>Semester</Table.Head>
                  <Table.Head>Pflicht</Table.Head>
                  <Table.Head class="w-20">Aktionen</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {#each value as entry, index (`${entry.specialization ?? entry.po}-${entry.mandatory}`)}
                  <Table.Row>
                    <Table.Cell class="font-medium">
                      {showPOEntry(entry)}
                    </Table.Cell>
                    <Table.Cell>
                      {showRecommendedSemester(entry.recommendedSemester)}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge variant={entry.mandatory ? 'default' : 'secondary'}>
                        {entry.mandatory ? 'Pflicht' : 'Wahl'}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <div class="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label="PO-Zuordnung bearbeiten"
                          onclick={() => openEditPODialog(index)}
                        >
                          <SquarePen class="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label="PO-Zuordnung löschen"
                          class="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onclick={() => deletePO(index)}
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
        {:else}
          <div
            class="border-muted-foreground/25 bg-muted/10 rounded-md border border-dashed px-4 py-6 text-center"
          >
            <p class="text-muted-foreground text-sm">Noch keine PO-Zuordnungen vorhanden.</p>
          </div>
        {/if}

        <input hidden value={JSON.stringify(value)} name={props.name} />
      </div>
    {/snippet}
  </Form.Control>
  <Form.FieldErrors />
</Form.Field>

<!-- PO Add/Edit Sub-Dialog -->
<Dialog.Root bind:open={subDialogOpen}>
  <Dialog.Content class="max-w-lg">
    <Dialog.Header>
      <Dialog.Title>
        {poEditingIndex !== null ? 'PO-Zuordnung bearbeiten' : 'PO-Zuordnung hinzufügen'}
      </Dialog.Title>
      <Dialog.Description>
        Studiengang auswählen und Semester sowie Pflichtangabe festlegen.
      </Dialog.Description>
    </Dialog.Header>

    <div class="space-y-4 py-4">
      <Combobox
        form={poDialogForm}
        name="fullPOId"
        label="Studiengang und PO"
        placeholder="Studiengang auswählen…"
        options={studyProgramOptions}
        bind:value={$poDialogFormData.fullPOId}
        errors={$poDialogErrors}
        width="w-[400px]"
      />

      <MultiSelectCombobox
        form={poDialogForm}
        name="recommendedSemester"
        label="Empfohlenes Studiensemester (optional)"
        options={semesterOptions}
        bind:value={poRecommendedSemester.value}
        errors={$poDialogErrors}
      />

      <div class="flex items-center space-x-3">
        <Switch id="po-mandatory" bind:checked={$poDialogFormData.mandatory} />
        <Label for="po-mandatory">Pflichtmodul in diesem Studiengang</Label>
      </div>
    </div>

    <Dialog.Footer class="gap-2">
      <Button type="button" variant="outline" onclick={() => (subDialogOpen = false)}>
        Abbrechen
      </Button>
      <Button type="button" onclick={handlePODialogSave}>
        {poEditingIndex !== null ? 'Änderungen speichern' : 'Hinzufügen'}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
