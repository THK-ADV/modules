<script lang="ts" module>
  interface Props {
    form: any
    name: string // name of the field in the form
    studyPrograms: StudyProgram[]
    value: POOptional[]
    errors?: any
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
  import { moduleUpdateState } from '$lib/store.svelte'
  import type { POOptional } from '$lib/types/module-protocol'
  import { getFullPOId, type StudyProgram } from '$lib/types/study-program'
  import { Edit, Plus, Trash2 } from '@lucide/svelte'
  import { superForm } from 'sveltekit-superforms'
  import { zodClient } from 'sveltekit-superforms/adapters'
  import { z } from 'zod'
  import { createSemesterOptions, showPO, showRecommendedSemester } from './forms'

  // TODO: INF2 can only have one generic module, but it may have multiple generic modules (WASP1 and WASP2)

  let { form, name, studyPrograms, value = $bindable(), errors = {} }: Props = $props()

  const genericModules = moduleUpdateState.genericModules

  const studyProgramsWithGenericModules = studyPrograms.filter((sp) => {
    const fullPOId = getFullPOId(sp)
    return genericModules.some(({ pos }) => pos.includes(fullPOId))
  })

  const schema = z.object({
    fullPOId: z.string().nonempty('Studiengang ist erforderlich'),
    recommendedSemester: z.array(z.number()).optional().default([]),
    instanceOf: z.string().nonempty('Modul ist erforderlich')
  })

  let dialogOpen = $state(false)
  let editingIndex = $state<number | null>(null)

  // dialog form and validation

  const dialogForm = superForm(
    {
      fullPOId: '',
      recommendedSemester: [] as number[],
      instanceOf: ''
    },
    {
      SPA: true,
      validators: zodClient(schema),
      resetForm: false,
      onUpdate(event) {
        console.log(event)
      }
    }
  )

  const isDialogFormValid = $derived.by(() => {
    const errors = $dialogErrors
    return (
      !Object.keys(errors).some((k) => errors[k as keyof typeof errors]) &&
      $dialogFormData.fullPOId !== '' &&
      $dialogFormData.instanceOf !== ''
    )
  })

  const { form: dialogFormData, errors: dialogErrors, reset, validate } = dialogForm

  async function handleSubmit() {
    const poValid = await validate('fullPOId')
    const instanceOfValid = await validate('instanceOf')

    if (poValid === undefined && instanceOfValid === undefined) {
      saveEntry()
      dialogOpen = false
    }
  }

  // pre select generic module if there is only one for the selected PO

  let previousPOId = $state('')

  $effect(() => {
    const selectedFullPOId = $dialogFormData.fullPOId
    if (previousPOId !== selectedFullPOId) {
      previousPOId = selectedFullPOId

      if (selectedFullPOId === '' || genericModules.length === 0) {
        return
      }

      const genericModulesForPO = genericModules.filter(({ pos }) => pos.includes(selectedFullPOId))
      if (genericModulesForPO.length === 1) {
        $dialogFormData.instanceOf = genericModulesForPO[0].id
      }
    }
  })

  // dialog handling

  function openAddDialog() {
    editingIndex = null
    reset({
      data: {
        fullPOId: '',
        recommendedSemester: [],
        instanceOf: ''
      }
    })
    dialogOpen = true
  }

  function openEditDialog(index: number) {
    editingIndex = index
    const { po, specialization, recommendedSemester, instanceOf } = value[index]
    reset({
      data: { fullPOId: specialization ?? po, recommendedSemester, instanceOf }
    })
    dialogOpen = true
  }

  // form options

  const semesterOptions = createSemesterOptions()

  const studyProgramOptions = $derived.by(() => {
    const current = value
    const selectedFullPOId = $dialogFormData.fullPOId

    return studyProgramsWithGenericModules
      .filter((sp) => {
        const fullPOId = getFullPOId(sp)
        const isAlreadyUsed = current.some(
          ({ specialization, po }) => (specialization ?? po) === fullPOId
        )
        // allow if not used, or if editing and this is the current PO
        return !isAlreadyUsed || fullPOId === selectedFullPOId
      })
      .map((sp) => ({
        id: getFullPOId(sp),
        deLabel: fmtStudyProgram(sp)
      }))
  })

  const instanceOfOptions = $derived.by(() => {
    const selectedFullPOId = $dialogFormData.fullPOId
    if (selectedFullPOId === '') {
      return []
    }
    return genericModules
      .filter(({ pos }) => pos.includes(selectedFullPOId))
      .map(({ id, title, abbrev, pos }) => {
        const po = pos.find((po) => selectedFullPOId === po)
        console.assert(
          po !== undefined,
          `po ${selectedFullPOId} must be defined since generic modules are only shown if a po is selected`
        )
        return { id, deLabel: `${title} (${abbrev})` }
      })
  })

  // updates

  function saveEntry() {
    const sp = studyPrograms.find((sp) => getFullPOId(sp) === $dialogFormData.fullPOId)

    if (!sp) {
      console.error(`Study program not found for ID: ${$dialogFormData.fullPOId}`)
      return
    }

    let newEntry: POOptional
    if (sp?.specialization?.id) {
      // since the fullPOId is saved in the form, we need to get the po and specialization from the associated study program
      newEntry = {
        po: sp.po.id,
        specialization: sp.specialization.id,
        recommendedSemester: $dialogFormData.recommendedSemester,
        instanceOf: $dialogFormData.instanceOf,
        partOfCatalog: false // keep it false for now
      }
    } else {
      newEntry = {
        po: $dialogFormData.fullPOId,
        specialization: null,
        recommendedSemester: $dialogFormData.recommendedSemester,
        instanceOf: $dialogFormData.instanceOf,
        partOfCatalog: false // keep it false for now
      }
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

  // table rendering

  const showPOOptional = showPO(studyPrograms)

  function showModule(moduleId: string) {
    const genericModule = genericModules.find(({ id }) => id === moduleId)
    return genericModule ? `${genericModule.title} (${genericModule.abbrev})` : moduleId
  }

  let recommendedSemester = {
    get value() {
      return $dialogFormData.recommendedSemester.map((s) => s.toString())
    },
    set value(newValue: string[]) {
      $dialogFormData.recommendedSemester = newValue.map((s) => +s)
    }
  }
</script>

<Form.Field {form} {name}>
  <Form.Control>
    {#snippet children({ props })}
      <div class="space-y-4">
        <div class="border-b pb-2">
          <Form.Label class="text-lg font-medium text-foreground"
            >Verwendung in Studiengängen als Wahlmodul (optional)</Form.Label
          >
          <Form.Description class="mt-1 text-sm text-muted-foreground">
            Hier wird festgelegt, in welchen Studiengängen das Modul als Wahlmodul / WPF gelehrt
            wird.
          </Form.Description>
        </div>
      </div>

      <div class="space-y-6">
        {#if value.length > 0}
          <div class="space-y-4">
            <!-- Add Button -->
            <Button
              type="button"
              variant="outline"
              onclick={openAddDialog}
              class="w-full sm:w-auto"
            >
              <Plus class="mr-2 h-4 w-4" />
              PO-Beziehung hinzufügen
            </Button>

            <!-- Study Program Relations Table -->
            <div class="rounded-md border">
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.Head>Studiengang und PO</Table.Head>
                    <Table.Head>Empfohlendes Studiensemester</Table.Head>
                    <Table.Head>Gehört zu</Table.Head>
                    <Table.Head class="w-24">Aktionen</Table.Head>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {#each value as entry, index (entry.specialization ?? entry.po)}
                    <Table.Row>
                      <Table.Cell class="font-medium">
                        {showPOOptional(entry)}
                      </Table.Cell>
                      <Table.Cell>
                        {showRecommendedSemester(entry.recommendedSemester)}
                      </Table.Cell>
                      <Table.Cell>
                        {showModule(entry.instanceOf)}
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
          </div>
        {:else}
          <div class="rounded-md border border-dashed border-muted-foreground/25 bg-muted/10">
            <div class="flex flex-col items-center justify-center px-6 py-8 text-center">
              <div class="mb-3 rounded-full bg-muted p-3">
                <svg
                  class="h-6 w-6 text-muted-foreground"
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
              <h3 class="mb-2 text-base font-medium text-foreground">
                Keine Wahlmodul-Zugehörigkeiten definiert
              </h3>
              <p class="mb-4 max-w-sm text-sm text-muted-foreground">
                Das Modul wird aktuell in keinem Studiengang als Wahlmodul gelehrt.
              </p>
              <Button type="button" variant="outline" onclick={openAddDialog}>
                <Plus class="mr-2 h-4 w-4" />
                PO-Beziehung hinzufügen
              </Button>
            </div>
          </div>
        {/if}
      </div>

      <!-- Hidden input for form integration -->
      <input hidden value={JSON.stringify(value)} name={props.name} />
    {/snippet}
  </Form.Control>

  <Form.FieldErrors />

  <Form.Description class="mt-4">
    Änderungen an den Studiengangs- und PO-Beziehungen müssen von dem jeweils zuständigen <a
      href="/help/approval"
      class="text-primary underline hover:no-underline">PAV geprüft</a
    > werden.
  </Form.Description>

  <!-- Add/Edit Dialog -->
  <Dialog.Root bind:open={dialogOpen}>
    <Dialog.Content class="max-w-lg">
      <Dialog.Header>
        <Dialog.Title>
          {editingIndex !== null
            ? 'Wahlmodul-Zugehörigkeit zu Studiengängen bearbeiten'
            : 'Wahlmodul-Zugehörigkeit zu Studiengängen hinzufügen'}
        </Dialog.Title>
      </Dialog.Header>

      <div class="space-y-4 py-4">
        <!-- Study Program Selection -->
        <Combobox
          form={dialogForm}
          name="fullPOId"
          label="Studiengang und PO"
          placeholder="Studiengang auswählen…"
          description="Wählen Sie einen Studiengang mit PO aus, indem das Modul als Wahlmodul angeboten werden soll."
          options={studyProgramOptions}
          bind:value={$dialogFormData.fullPOId}
          errors={$dialogErrors}
          width="w-[450px]"
        />

        {#if $dialogFormData.fullPOId !== ''}
          <Combobox
            form={dialogForm}
            name="instanceOf"
            label="Zugehöriges Modul aus dem Studienverlaufsplan"
            placeholder="Modul auswählen…"
            description="Wählen Sie das Modul aus, worauf dieses Modul einzahlen soll. Das ist typischerweise das generische Wahlmodul bzw WPF."
            options={instanceOfOptions}
            bind:value={$dialogFormData.instanceOf}
            errors={$dialogErrors}
            width="w-[450px]"
          />
        {/if}

        <!-- Recommended Semesters Selection -->
        <MultiSelectCombobox
          form={dialogForm}
          name="recommendedSemester"
          label="Empfohlendes Studiensemester (optional)"
          description="Die empfohlenden Studiensemester, in denen das Modul in dem Studiengang belegt werden soll."
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
</Form.Field>
