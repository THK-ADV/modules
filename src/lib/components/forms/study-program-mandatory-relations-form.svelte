<script lang="ts" module>
  interface Props {
    form: any // eslint-disable-line @typescript-eslint/no-explicit-any
    name: string // name of the field in the form
    studyPrograms: StudyProgram[]
    value: POMandatory[]
    modificationStatus?: ModificationStatus // optional modification tracking
  }
</script>

<script lang="ts">
  import Combobox from '$lib/components/combobox.svelte'
  import MultiSelectCombobox from '$lib/components/multi-select-combobox.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import * as Form from '$lib/components/ui/form/index.js'
  import * as Table from '$lib/components/ui/table/index.js'
  import { fmtStudyProgram } from '$lib/formats'
  import type { POMandatory } from '$lib/types/module-protocol'
  import { getFullPOId, type StudyProgram } from '$lib/types/study-program'
  import type { ModificationStatus } from '$lib/types/module-draft-keys'
  import { getFieldHighlightClasses } from '$lib/types/module-draft-keys'
  import ModificationIndicator from '../modification-indicator.svelte'
  import { Edit, Plus, Trash2 } from '@lucide/svelte'
  import { superForm } from 'sveltekit-superforms'
  import { zodClient } from 'sveltekit-superforms/adapters'
  import { z } from 'zod'
  import { createSemesterOptions, showPO, showRecommendedSemester } from './forms'

  const schema = z.object({
    fullPOId: z.string().nonempty('Studiengang ist erforderlich'),
    recommendedSemester: z.array(z.number()).optional().default([])
  })

  let { form, name, studyPrograms, value = $bindable(), modificationStatus }: Props = $props()

  let dialogOpen = $state(false)
  let editingIndex = $state<number | null>(null)

  // dialog form and validation

  const dialogForm = superForm(
    {
      fullPOId: '',
      recommendedSemester: [] as number[]
    },
    {
      SPA: true,
      validators: zodClient(schema),
      resetForm: false
    }
  )

  const { form: dialogFormData, errors: dialogErrors, reset, validate } = dialogForm

  const isDialogFormValid = $derived.by(() => {
    const errors = $dialogErrors
    return (
      !Object.keys(errors).some((k) => errors[k as keyof typeof errors]) &&
      $dialogFormData.fullPOId !== ''
    )
  })

  async function handleSubmit() {
    const poValid = await validate('fullPOId')

    if (poValid === undefined) {
      saveEntry()
      dialogOpen = false
    }
  }

  // dialog handling

  function openAddDialog() {
    editingIndex = null
    reset({
      data: {
        fullPOId: '',
        recommendedSemester: []
      }
    })
    dialogOpen = true
  }

  function openEditDialog(index: number) {
    editingIndex = index
    const { po, specialization, recommendedSemester } = value[index]
    reset({
      data: { fullPOId: specialization ?? po, recommendedSemester }
    })
    dialogOpen = true
  }

  // form options

  const semesterOptions = createSemesterOptions()

  const studyProgramOptions = $derived.by(() => {
    const current = value
    const currentPo = editingIndex !== null ? current[editingIndex] : null

    return studyPrograms
      .filter((sp) => {
        const fullPOId = getFullPOId(sp)
        const isAlreadyUsed = current.some(
          ({ specialization, po }) => (specialization ?? po) === fullPOId
        )
        // allow if not used, or if editing and this is the current PO
        return !isAlreadyUsed || fullPOId === (currentPo?.specialization ?? currentPo?.po)
      })
      .map((sp) => ({
        id: getFullPOId(sp),
        deLabel: fmtStudyProgram(sp)
      }))
  })

  // updates

  function saveEntry() {
    const sp = studyPrograms.find((sp) => getFullPOId(sp) === $dialogFormData.fullPOId)

    if (!sp) {
      console.error(`Study program not found for ID: ${$dialogFormData.fullPOId}`)
      return
    }

    let newEntry: POMandatory
    if (sp?.specialization?.id) {
      // since the fullPOId is saved in the form, we need to get the po and specialization from the associated study program
      newEntry = {
        po: sp.po.id,
        specialization: sp.specialization.id,
        recommendedSemester: $dialogFormData.recommendedSemester
      }
    } else {
      newEntry = {
        po: $dialogFormData.fullPOId,
        specialization: null,
        recommendedSemester: $dialogFormData.recommendedSemester
      }
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

  // svelte-ignore state_referenced_locally
  const showPOMandatory = showPO(studyPrograms)

  let recommendedSemester = {
    get value() {
      return $dialogFormData.recommendedSemester.map((s) => s.toString())
    },
    set value(newValue: string[]) {
      $dialogFormData.recommendedSemester = newValue.map((s) => +s)
    }
  }
</script>

{#snippet mandatoryRelationsContent(props: { name: string })}
  <div class="space-y-6">
    {#if value.length > 0}
      <div class="space-y-4">
        <!-- Add Button -->
        <Button type="button" variant="outline" onclick={openAddDialog} class="w-full sm:w-auto">
          <Plus class="mr-2 size-4" />
          PO-Beziehung hinzufügen
        </Button>

        <!-- Study Program Relations Table -->
        <div class="rounded-md border">
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.Head>Studiengang und PO</Table.Head>
                <Table.Head>Empfohlenes Studiensemester</Table.Head>
                <Table.Head class="w-24">Aktionen</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {#each value as entry, index (entry.specialization ?? entry.po)}
                <Table.Row>
                  <Table.Cell class="font-medium">
                    {showPOMandatory(entry)}
                  </Table.Cell>
                  <Table.Cell>
                    {showRecommendedSemester(entry.recommendedSemester)}
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
                        <Edit class="size-4" />
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
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h3 class="text-foreground mb-2 text-base font-medium">
            Keine Pflichtmodul-Zugehörigkeiten definiert
          </h3>
          <p class="text-muted-foreground mb-4 max-w-sm">
            Das Modul wird aktuell in keinem Studiengang als Pflichtmodul gelehrt.
          </p>
          <Button type="button" variant="outline" onclick={openAddDialog}>
            <Plus class="mr-2 size-4" />
            PO-Beziehung hinzufügen
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
      <span class="text-foreground text-base font-medium"
        >Verwendung in Studiengängen als Pflichtmodul (optional)</span
      >
      <ModificationIndicator status={modificationStatus} iconOnly={false} inline={true} />
    </div>
    <p class="text-muted-foreground text-sm">
      Hier wird festgelegt, in welchen Studiengängen das Modul als Pflichtmodul gelehrt wird.
    </p>
    <Form.Field {form} {name}>
      <Form.Control>
        {#snippet children({ props })}
          {@render mandatoryRelationsContent(props)}
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
      <Form.Description class="mt-4">
        Änderungen an den Studiengangs- und PO-Beziehungen müssen von dem jeweils zuständigen <a
          href="/help#review-process"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary underline hover:no-underline">PAV geprüft</a
        > werden. Die Eingaben müssen dem Studienverlaufsplan entsprechen.
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
            <Form.Label class="text-foreground text-base font-medium"
              >Verwendung in Studiengängen als Pflichtmodul (optional)</Form.Label
            >
            <Form.Description class="text-muted-foreground mt-1 text-sm">
              Hier wird festgelegt, in welchen Studiengängen das Modul als Pflichtmodul gelehrt
              wird.
            </Form.Description>
          </div>
        </div>
        {@render mandatoryRelationsContent(props)}
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
    <Form.Description class="mt-4">
      Änderungen an den Studiengangs- und PO-Beziehungen müssen von dem jeweils zuständigen <a
        href="/help#review-process"
        target="_blank"
        rel="noopener noreferrer"
        class="text-primary underline hover:no-underline">PAV geprüft</a
      > werden. Die Eingaben müssen dem Studienverlaufsplan entsprechen.
    </Form.Description>
  </Form.Field>
{/if}

<!-- Add/Edit Dialog -->
<Dialog.Root bind:open={dialogOpen}>
  <Dialog.Content class="max-w-lg">
    <Dialog.Header>
      <Dialog.Title>
        {editingIndex !== null
          ? 'Pflicht-Zugehörigkeit zu Studiengängen bearbeiten'
          : 'Pflicht-Zugehörigkeit zu Studiengängen hinzufügen'}
      </Dialog.Title>
    </Dialog.Header>

    <div class="space-y-4 py-4">
      <!-- Study Program Selection -->
      <Combobox
        form={dialogForm}
        name="fullPOId"
        label="Studiengang und PO"
        placeholder="Studiengang auswählen…"
        description="Wählen Sie einen Studiengang mit PO aus, indem das Modul als Pflichtmodul angeboten werden soll."
        options={studyProgramOptions}
        bind:value={$dialogFormData.fullPOId}
        errors={$dialogErrors}
        width="w-[450px]"
      />

      <!-- Recommended Semesters Selection -->
      <MultiSelectCombobox
        form={dialogForm}
        name="recommendedSemester"
        label="Empfohlenes Studiensemester (optional)"
        description="Die empfohlenen Studiensemester, in denen das Modul in dem Studiengang belegt werden soll."
        options={semesterOptions}
        bind:value={recommendedSemester.value}
        errors={$dialogErrors}
      />
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
