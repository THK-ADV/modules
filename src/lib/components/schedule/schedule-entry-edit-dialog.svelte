<script lang="ts">
  import { Badge } from '$lib/components/ui/badge'
  import { Button, buttonVariants } from '$lib/components/ui/button/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import * as Form from '$lib/components/ui/form/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import { Separator } from '$lib/components/ui/separator/index.js'
  import { Switch } from '$lib/components/ui/switch/index.js'
  import * as Table from '$lib/components/ui/table/index.js'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'
  import { schedulePlanningFilter } from '$lib/stores/schedule-filter.svelte'
  import type { CourseType, PO, ScheduleEntryCreate, ScheduleEntryEdit } from '$lib/types/schedule'
  import { fromDate, getLocalTimeZone, type DateValue } from '@internationalized/date'
  import { Copy, Plus, SquarePen, Trash2 } from '@lucide/svelte'
  import { superForm } from 'sveltekit-superforms'
  import { zod4 } from 'sveltekit-superforms/adapters'
  import { z } from 'zod/v4'
  import Combobox from '../combobox.svelte'
  import DateTimePicker from '../forms/date-time-picker.svelte'
  import { createSemesterOptions, showRecommendedSemester } from '../forms/forms'
  import MultiSelectCombobox from '../multi-select-combobox.svelte'
  import Calendar from '../ui/calendar/calendar.svelte'

  export interface Create {
    id: 'create'
    onCreate: (entries: ScheduleEntryCreate[]) => void
    prefilled?: Partial<ScheduleEntryCreate>
  }

  export interface Edit {
    id: 'edit'
    entry: ScheduleEntryEdit
    onUpdate: (entry: ScheduleEntryEdit) => void
    onDuplicate: (entry: ScheduleEntryCreate) => void
    onDelete: (id: string) => void
  }

  export interface Duplicate {
    id: 'duplicate'
    entry: ScheduleEntryCreate
    onCreate: (entries: ScheduleEntryCreate[]) => void
  }

  export type Mode = Create | Edit | Duplicate

  interface Props {
    mode: Mode
    onClose: () => void
    holidays: Date[]
  }

  function arraysEqual(lhs: string[], rhs: string[]): boolean {
    if (lhs.length !== rhs.length) return false
    const sortedA = [...lhs].sort()
    const sortedB = [...rhs].sort()
    return sortedA.every((val, index) => val === sortedB[index])
  }

  function posEqual(lhs: PO[], rhs: PO[]): boolean {
    if (lhs.length !== rhs.length) return false
    const sortL = [...lhs].sort((a, b) => a.po.localeCompare(b.po))
    const sortR = [...rhs].sort((a, b) => a.po.localeCompare(b.po))
    return sortL.every((l, i) => {
      const r = sortR[i]
      return (
        l.po === r.po &&
        l.specialization === r.specialization &&
        l.mandatory === r.mandatory &&
        l.recommendedSemester.length === r.recommendedSemester.length &&
        [...l.recommendedSemester]
          .sort((a, b) => a - b)
          .every((v, j) => v === [...r.recommendedSemester].sort((a, b) => a - b)[j])
      )
    })
  }

  function hasActualChanges(lhs: ScheduleEntryCreate, rhs: ScheduleEntryEdit): boolean {
    return (
      lhs.module !== rhs.module ||
      !arraysEqual(lhs.rooms, rhs.rooms) ||
      lhs.courseType !== rhs.courseType ||
      !posEqual(lhs.props.po, rhs.props.po) ||
      lhs.start.getTime() !== rhs.start.getTime() ||
      lhs.end.getTime() !== rhs.end.getTime() ||
      !arraysEqual(lhs.props.lecturer, rhs.props.lecturer)
    )
  }

  function createformData(
    entry: ScheduleEntryEdit | ScheduleEntryCreate | Partial<ScheduleEntryCreate> | null
  ) {
    const schema = z.object({
      module: z.string().min(1, 'Modulbezeichnung erforderlich'),
      rooms: z.array(z.string()).min(1, 'Mindestens ein Raum erforderlich'),
      courseType: z.string().min(1, 'Kursart ist erforderlich'),
      pos: z
        .array(
          z.object({
            po: z.string().min(1, 'Studiengang erforderlich'),
            recommendedSemester: z.array(z.number()),
            mandatory: z.boolean()
          })
        )
        .min(1, 'Mindestens eine PO Beziehung erforderlich'),
      date: z
        .object({
          start: z.date({ error: 'Beginn der Veranstaltung erforderlich' }),
          end: z.date({ error: 'Ende der Veranstaltung erforderlich' })
        })
        .refine(({ start, end }) => end > start, {
          error: 'Ende der Veranstaltung muss nach dem Beginn liegen',
          path: ['end']
        }),
      lecturer: z.array(z.string())
    })

    return superForm(
      {
        module: entry?.module ?? '',
        rooms: entry?.rooms ?? [],
        courseType: entry?.courseType ?? '',
        pos:
          entry?.props?.po.map(({ po, recommendedSemester, mandatory }) => ({
            po,
            recommendedSemester,
            mandatory
          })) ?? [],
        date: {
          start: entry?.start ?? null,
          end: entry?.end ?? null
        },
        lecturer: entry?.props?.lecturer ?? []
      },
      {
        SPA: true,
        dataType: 'json',
        validators: zod4(schema),
        onChange: async (event) => {
          if (event.paths.includes('module')) {
            await updateLecturerByModule(event.get('module'))
          }
        }
      }
    )
  }

  let { mode, onClose, holidays }: Props = $props()

  // Repeated date entries
  let repeatEntry = $derived(mode != null && mode.id === 'duplicate')
  let repeatedEntries = $state<DateValue[]>([])

  const saveButtonDisabled = $derived(
    mode != null && mode.id === 'duplicate' && repeatedEntries.length === 0
  )

  // Proxy for the date.start field
  let dateStart = {
    get value() {
      return $formData.date.start
    },
    set value(newValue: Date | null) {
      $formData.date.start = newValue
    }
  }

  // Proxy for the date.end field
  let dateEnd = {
    get value() {
      return $formData.date.end
    },
    set value(newValue: Date | null) {
      $formData.date.end = newValue
    }
  }

  // Disable date selection for repeated entries
  function isDateUnavailableForRepeatedEntries(date: DateValue): boolean {
    const isHoliday = holidays.some(
      (h) =>
        date.day === h.getDate() && date.month === h.getMonth() + 1 && date.year === h.getFullYear()
    )
    if (isHoliday) return true

    const selected = dateStart.value
    if (selected == null) return false

    return (
      date.day === selected.getDate() &&
      date.month === selected.getMonth() + 1 &&
      date.year === selected.getFullYear()
    )
  }

  // UI state

  const title = $derived.by(() => {
    switch (mode.id) {
      case 'create':
        return 'Neuer Eintrag'
      case 'duplicate': {
        const module = schedulePlanningFilter.modules.find((m) => m.id === mode.entry.module)
        if (module) {
          return `"${module.label}" duplizieren`
        }
        return 'Eintrag duplizieren'
      }
      case 'edit': {
        const module = schedulePlanningFilter.modules.find((m) => m.id === mode.entry.module)
        if (module) {
          return `"${module.label}" bearbeiten`
        }
        return 'Eintrag bearbeiten'
      }
    }
  })

  const description = $derived.by(() => {
    switch (mode.id) {
      case 'create':
        return 'Neuen Stundenplan-Eintrag anlegen.'
      case 'duplicate':
        return 'Neuen Stundenplan-Eintrag basierend auf dem ausgewählten Modul anlegen.'
      case 'edit':
        return 'Bestehenden Eintrag bearbeiten und anpassen.'
    }
  })

  const form = $derived.by(() => {
    switch (mode.id) {
      case 'create':
        return createformData(mode.prefilled ?? null)
      case 'duplicate':
        return createformData(mode.entry)
      case 'edit':
        return createformData(mode.entry)
    }
  })

  const { form: formData, errors, validate } = $derived(form)

  // Options

  const moduleOptions = schedulePlanningFilter.modules.map((m) => ({
    id: m.id,
    deLabel: m.label
  }))

  const roomOptions = schedulePlanningFilter.rooms.map((r) => ({
    id: r.id,
    label: r.label,
    abbrev: r.badge
  }))

  const courseTypeOptions = schedulePlanningFilter.courseTypes.map((ct) => ({
    id: ct.id,
    deLabel: ct.label
  }))

  const poOptions = schedulePlanningFilter.studyPrograms.map((sp) => ({
    id: sp.id,
    deLabel: sp.label
  }))

  const lecturerOptions = schedulePlanningFilter.identities.map((i) => ({
    id: i.id,
    label: i.label,
    abbrev: i.label
  }))

  function createCurrentEntry(): ScheduleEntryCreate {
    return {
      module: $formData.module,
      rooms: $formData.rooms,
      courseType: $formData.courseType as CourseType,
      props: {
        po: $formData.pos.map(({ po, recommendedSemester, mandatory }) => ({
          po,
          recommendedSemester,
          mandatory,
          specialization: null
        })),
        lecturer: $formData.lecturer
      },
      start: new Date($formData.date.start!),
      end: new Date($formData.date.end!)
    }
  }

  function createRepeatedEntries(current: ScheduleEntryCreate): ScheduleEntryCreate[] {
    if (!repeatEntry || repeatedEntries.length === 0) {
      return [current]
    }

    const entries = [current]

    for (const date of repeatedEntries) {
      // care: JavaScript months are 0-indexed, but the date library is 1-indexed
      if (
        current.start.getDate() === date.day &&
        current.start.getMonth() === date.month - 1 &&
        current.start.getFullYear() === date.year
      ) {
        // already added
        continue
      }

      const newEntry = {
        ...current,
        start: new Date(
          date.year,
          date.month - 1,
          date.day,
          current.start.getHours(),
          current.start.getMinutes()
        ),
        end: new Date(
          date.year,
          date.month - 1,
          date.day,
          current.end.getHours(),
          current.end.getMinutes()
        )
      }
      entries.push(newEntry)
    }

    return entries
  }

  function duplicateEntries(origin: ScheduleEntryCreate): ScheduleEntryCreate[] {
    if (!repeatEntry || repeatedEntries.length === 0) {
      return []
    }
    return repeatedEntries.map((date) => {
      return {
        ...origin,
        start: new Date(
          date.year,
          date.month - 1,
          date.day,
          origin.start.getHours(),
          origin.start.getMinutes()
        ),
        end: new Date(
          date.year,
          date.month - 1,
          date.day,
          origin.end.getHours(),
          origin.end.getMinutes()
        )
      }
    })
  }

  async function handleSave() {
    const moduleErr = await validate('module')
    const startErr = await validate('date.start')
    const endErr = await validate('date.end')
    const poErr = await validate('pos')
    const courseTypeErr = await validate('courseType')
    const roomsErr = await validate('rooms')

    if (!moduleErr && !startErr && !endErr && !poErr && !courseTypeErr && !roomsErr) {
      const current = createCurrentEntry()

      switch (mode.id) {
        case 'create': {
          // creating new entry
          mode.onCreate(createRepeatedEntries(current))
          break
        }
        case 'edit': {
          // editing existing entry
          if (hasActualChanges(current, $state.snapshot(mode.entry))) {
            // did changes, update new entry
            mode.onUpdate({ id: mode.entry.id, ...current })
          } else {
            // no changes, close dialog
            onClose()
          }
          break
        }
        case 'duplicate': {
          // creating new entry
          const duplicates = duplicateEntries(current)
          if (duplicates.length > 0) {
            mode.onCreate(duplicates)
          } else {
            // no duplicates, close dialog
            onClose()
          }
          break
        }
      }
    }
  }

  // PO dialog

  function deletePO(index: number) {
    $formData.pos = $formData.pos.filter((_, i) => i !== index)
    form.validate('pos')
  }

  let poDialogOpen = $state(false)
  let poEditingIndex = $state<number | null>(null)

  const poDialogForm = superForm(
    {
      po: '',
      recommendedSemester: [] as number[],
      mandatory: false
    },
    {
      SPA: true,
      dataType: 'json',
      validators: zod4(
        z.object({
          po: z.string().min(1, 'Studiengang erforderlich'),
          recommendedSemester: z.array(z.number()),
          mandatory: z.boolean()
        })
      ),
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

  const filteredPOOptions = $derived.by(() => {
    const currentPOs = $formData.pos
    const editingPO = poEditingIndex !== null ? currentPOs[poEditingIndex]?.po : null
    return poOptions.filter((opt) => {
      const isAlreadyUsed = currentPOs.some((p) => p.po === opt.id)
      return !isAlreadyUsed || opt.id === editingPO
    })
  })

  function getPOLabel(poId: string): string {
    return poOptions.find((opt) => opt.id === poId)?.deLabel ?? poId
  }

  function openAddPODialog() {
    poEditingIndex = null
    resetPODialog({
      data: { po: '', recommendedSemester: [], mandatory: false }
    })
    poDialogOpen = true
  }

  function openEditPODialog(index: number) {
    poEditingIndex = index
    const entry = $formData.pos[index]
    resetPODialog({
      data: {
        po: entry.po,
        recommendedSemester: [...entry.recommendedSemester],
        mandatory: entry.mandatory
      }
    })
    poDialogOpen = true
  }

  async function handlePODialogSave() {
    const poValid = await validatePODialog('po')
    if (poValid === undefined) {
      const newEntry = {
        po: $poDialogFormData.po,
        recommendedSemester: $poDialogFormData.recommendedSemester,
        mandatory: $poDialogFormData.mandatory
      }
      if (poEditingIndex !== null) {
        $formData.pos = $formData.pos.map((item, i) => (i === poEditingIndex ? newEntry : item))
      } else {
        $formData.pos = [...$formData.pos, newEntry]
      }
      form.validate('pos')
      poDialogOpen = false
    }
  }

  async function updateLecturerByModule(module: string) {
    const resp = await fetch('/schedule-planning?select=lecturers&module=' + module)
    if (resp.ok) {
      $formData.lecturer = await resp.json()
    }
  }
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === 'Delete' && mode.id === 'edit' && !poDialogOpen) {
      e.preventDefault()
      mode.onDelete(mode.entry.id)
    }
  }}
/>

<Dialog.Root
  open={true}
  onOpenChange={(open) => {
    if (!open) {
      onClose()
    }
  }}
>
  <Dialog.Content class="max-w-2xl" showClose={false} onOpenAutoFocus={(e) => e.preventDefault()}>
    <Dialog.Header class="space-y-0">
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0 flex-1">
          <Dialog.Title class="text-lg font-semibold">{title}</Dialog.Title>
          <Dialog.Description class="text-muted-foreground mt-1 text-sm"
            >{description}</Dialog.Description
          >
        </div>

        {#if mode.id === 'edit'}
          <div class="flex items-center gap-0.5">
            <Tooltip.Root>
              <Tooltip.Trigger>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  class="text-muted-foreground hover:text-foreground size-8"
                  onclick={() => mode.onDuplicate(createCurrentEntry())}
                >
                  <Copy class="size-4" />
                  <span class="sr-only">Eintrag duplizieren</span>
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Content>Eintrag duplizieren</Tooltip.Content>
            </Tooltip.Root>

            <Tooltip.Root>
              <Tooltip.Trigger>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  class="text-muted-foreground hover:bg-destructive/10 hover:text-destructive size-8"
                  onclick={() => mode.onDelete(mode.entry.id)}
                >
                  <Trash2 class="size-4" />
                  <span class="sr-only">Eintrag löschen</span>
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Content
                >Eintrag löschen <kbd
                  class="bg-muted text-muted-foreground ml-1 rounded px-1.5 py-0.5 text-xs font-medium"
                  >Del</kbd
                ></Tooltip.Content
              >
            </Tooltip.Root>
          </div>
        {/if}
      </div>
    </Dialog.Header>

    <Separator class="my-1" />

    <div class="space-y-4 py-2">
      <!-- Module -->
      <Combobox
        disabled={mode.id !== 'create'}
        {form}
        {errors}
        name="module"
        label="Modul"
        placeholder="Modul auswählen…"
        options={moduleOptions}
        bind:value={$formData.module}
        width="w-[450px]"
      />

      <!-- Lecturer -->
      <MultiSelectCombobox
        {form}
        {errors}
        name="lecturer"
        label="Dozierende"
        options={lecturerOptions}
        bind:value={$formData.lecturer}
        maxVisibleBadges={3}
      />

      <!-- Date & Time -->
      <div class="grid gap-2 md:grid-cols-2">
        <DateTimePicker
          {form}
          name="date.start"
          label="Beginn"
          bind:value={dateStart.value}
          disabled={mode.id === 'duplicate'}
          {errors}
        />
        <DateTimePicker
          {form}
          name="date.end"
          label="Ende"
          bind:value={dateEnd.value}
          disabled={mode.id === 'duplicate'}
          {errors}
        />
      </div>

      <!-- Repeat Entry -->
      {#if mode.id === 'create' || mode.id === 'duplicate'}
        <div class="flex flex-col space-y-2">
          <div class="flex items-center space-x-2">
            <Switch id="repeat" bind:checked={repeatEntry} />
            <Label for="repeat">Eintrag duplizieren</Label>
          </div>
          {#if repeatEntry}
            <!-- mark the current entry as selected -->
            <Calendar
              placeholder={$formData.date.start
                ? fromDate($formData.date.start, getLocalTimeZone())
                : undefined}
              bind:value={repeatedEntries}
              type="multiple"
              numberOfMonths={2}
              weekStartsOn={1}
              locale="de"
              isDateUnavailable={isDateUnavailableForRepeatedEntries}
            />
          {/if}
        </div>
      {/if}

      <div class="grid gap-2 md:grid-cols-2">
        <!-- Room -->
        <MultiSelectCombobox
          {form}
          {errors}
          name="rooms"
          label="Räume"
          options={roomOptions}
          bind:value={$formData.rooms}
          disabled={mode.id === 'duplicate'}
          maxVisibleBadges={3}
        />

        <!-- Course Type -->
        <Combobox
          {form}
          {errors}
          name="courseType"
          label="Kursart"
          placeholder="Kursart auswählen…"
          options={courseTypeOptions}
          bind:value={$formData.courseType}
          disabled={mode.id === 'duplicate'}
        />
      </div>

      <!-- POs -->
      {#if mode.id !== 'duplicate'}
        <Form.Field {form} name="pos">
          <Form.Control>
            {#snippet children({ props })}
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <Form.Label class="text-sm font-medium"
                    >Studiengänge und PO-Beziehungen</Form.Label
                  >
                  <Button type="button" variant="outline" size="sm" onclick={openAddPODialog}>
                    <Plus class="size-4" />
                    Hinzufügen
                  </Button>
                </div>

                {#if $formData.pos.length > 0}
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
                        {#each $formData.pos as entry, index (entry.po)}
                          <Table.Row>
                            <Table.Cell class="font-medium">
                              {getPOLabel(entry.po)}
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
                                  onclick={() => openEditPODialog(index)}
                                >
                                  <SquarePen class="size-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
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
                    <p class="text-muted-foreground text-sm">
                      Noch keine PO-Zuordnungen vorhanden.
                    </p>
                  </div>
                {/if}

                <input hidden value={JSON.stringify($formData.pos)} name={props.name} />
              </div>
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>
      {/if}
    </div>

    <Separator class="my-1" />

    <Dialog.Footer class="gap-2">
      <Dialog.Close class={buttonVariants({ variant: 'outline' })}>Abbrechen</Dialog.Close>
      <Button type="button" onclick={handleSave} disabled={saveButtonDisabled}>Speichern</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- PO Add/Edit Sub-Dialog -->
<Dialog.Root bind:open={poDialogOpen}>
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
        name="po"
        label="Studiengang und PO"
        placeholder="Studiengang auswählen…"
        options={filteredPOOptions}
        bind:value={$poDialogFormData.po}
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
      <Button type="button" variant="outline" onclick={() => (poDialogOpen = false)}>
        Abbrechen
      </Button>
      <Button type="button" onclick={handlePODialogSave}>
        {poEditingIndex !== null ? 'Änderungen speichern' : 'Hinzufügen'}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
