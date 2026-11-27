<script lang="ts">
  // Note(BK4A9F): Structural and semantic twin of Note(BK4A9F) in
  // booking-edit-dialog.svelte. Keep dialog chrome, create/edit/duplicate
  // modes, form/repeat/save/delete flow, and field layout in sync. Domain-specific
  // differences (always-module entries, no title/note/metadata) are expected.
  import { Button, buttonVariants } from '$lib/components/ui/button/index.js'
  import { ModuleSingleSelect } from '$lib/components/module-filter'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import { Separator } from '$lib/components/ui/separator/index.js'
  import { Switch } from '$lib/components/ui/switch/index.js'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'
  import { getErrorMessage } from '$lib/errors'
  import {
    arraysEqual,
    clonePOs,
    mergePOs,
    posEqual,
    scheduleEntryFormSchema,
    type ScheduleEntryCreate,
    type ScheduleEntryEdit,
    type ScheduleEntryFormData,
    type ScheduleEntryUpdateScope,
    type SeriesOccurrence
  } from '$lib/schemas/schedule'
  import { schedulePlanningFilter } from '$lib/stores/schedule-filter.svelte'
  import { fromDate, getLocalTimeZone, type DateValue } from '@internationalized/date'
  import { Copy, Trash2, TriangleAlert } from '@lucide/svelte'
  import { superForm } from 'sveltekit-superforms'
  import { zod4 } from 'sveltekit-superforms/adapters'
  import Combobox from '../combobox.svelte'
  import DateTimePicker from '../forms/date-time-picker.svelte'
  import MultiSelectCombobox from '../multi-select-combobox.svelte'
  import Calendar from '../ui/calendar/calendar.svelte'
  import { getLecturers, getPOs } from './schedule.remote'
  import ScheduleEntryPoField from './schedule-entry-po-field.svelte'
  import ScheduleEntryUpdateScopeDialog from './schedule-entry-update-scope-dialog.svelte'

  type PendingAction = 'save' | 'delete'
  type SaveIntent = 'save' | 'duplicate'

  export interface Create {
    id: 'create'
    onCreate: (entries: ScheduleEntryCreate[]) => Promise<void>
    prefilled?: Partial<ScheduleEntryCreate>
  }

  export interface Edit {
    id: 'edit'
    entry: ScheduleEntryEdit
    getSeries: (seriesId: string) => Promise<SeriesOccurrence[]>
    onUpdate: (entry: ScheduleEntryEdit, scope: ScheduleEntryUpdateScope) => Promise<void>
    onDuplicate: (entry: ScheduleEntryCreate) => void
    onDelete: (id: string) => Promise<void>
  }

  export interface Duplicate {
    id: 'duplicate'
    entry: ScheduleEntryCreate
    onCreate: (entries: ScheduleEntryCreate[]) => Promise<void>
  }

  export type Mode = Create | Edit | Duplicate

  interface Props {
    mode: Mode
    onClose: () => void
    holidays: Date[]
  }

  function hasActualChanges(lhs: ScheduleEntryCreate, rhs: ScheduleEntryEdit): boolean {
    return (
      lhs.module !== rhs.module ||
      !arraysEqual(lhs.rooms, rhs.rooms) ||
      lhs.courseType !== rhs.courseType ||
      !posEqual(lhs.po, mergePOs(rhs.po)) ||
      lhs.start.getTime() !== rhs.start.getTime() ||
      lhs.end.getTime() !== rhs.end.getTime() ||
      !arraysEqual(lhs.lecturer, rhs.lecturer)
    )
  }

  function createformData(
    entry: ScheduleEntryEdit | ScheduleEntryCreate | Partial<ScheduleEntryCreate> | null
  ) {
    return superForm(
      {
        module: entry?.module ?? '',
        rooms: entry?.rooms ?? [],
        courseType: entry?.courseType ?? '',
        pos: mergePOs(entry?.po ?? []),
        date: {
          start: entry?.start ?? null,
          end: entry?.end ?? null
        },
        lecturer: entry?.lecturer ?? []
      },
      {
        SPA: true,
        dataType: 'json',
        validators: zod4(scheduleEntryFormSchema),
        onChange: async (event) => {
          if (event.paths.includes('module')) {
            await prefillForm(event.get('module'))
          }
        }
      }
    )
  }

  let { mode, onClose, holidays }: Props = $props()

  // Repeated date entries
  let repeatEntry = $derived(mode != null && mode.id === 'duplicate')
  let repeatedEntries = $state<DateValue[]>([])
  let pendingAction = $state<PendingAction | null>(null)
  let dialogContentRef = $state<HTMLElement | null>(null)

  const saveButtonDisabled = $derived(
    pendingAction !== null ||
      (mode != null && mode.id === 'duplicate' && repeatedEntries.length === 0)
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

  const { form: formData, errors, validateForm } = $derived(form)

  // Options

  const roomOptions = schedulePlanningFilter.rooms.map((r) => ({
    id: r.id,
    label: r.label,
    abbrev: r.badge
  }))

  const courseTypeOptions = schedulePlanningFilter.courseTypes.map((ct) => ({
    id: ct.id,
    deLabel: ct.label
  }))

  const lecturerOptions = schedulePlanningFilter.identities.map((i) => ({
    id: i.id,
    label: i.label,
    abbrev: i.label
  }))

  function createCurrentEntry(
    seriesId: string,
    formData: ScheduleEntryFormData
  ): ScheduleEntryCreate {
    return {
      seriesId,
      module: formData.module,
      rooms: [...formData.rooms],
      courseType: formData.courseType,
      po: clonePOs(formData.pos),
      lecturer: [...formData.lecturer],
      start: new Date(formData.date.start),
      end: new Date(formData.date.end)
    }
  }

  let updateScopeDialogOpen = $state(false)
  let updateScopeDialog: {
    requestUpdateScope: (entry: ScheduleEntryEdit) => Promise<void>
  } | null = $state(null)
  let updateScopeErrorMessage = $state<string | undefined>(undefined)

  async function requestUpdate(entry: ScheduleEntryEdit) {
    if (mode.id !== 'edit') {
      return
    }

    updateScopeErrorMessage = undefined

    try {
      await updateScopeDialog?.requestUpdateScope(entry)
    } catch (error) {
      updateScopeErrorMessage = getErrorMessage(error)
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
        rooms: [...current.rooms],
        po: clonePOs(current.po),
        lecturer: [...current.lecturer],
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

  /**
   * Duplicates the given entry for each selected date.
   * @param origin
   */
  function duplicateEntries(origin: ScheduleEntryCreate): ScheduleEntryCreate[] {
    if (!repeatEntry || repeatedEntries.length === 0) {
      return []
    }
    return repeatedEntries.map((date) => {
      return {
        ...origin,
        rooms: [...origin.rooms],
        po: clonePOs(origin.po),
        lecturer: [...origin.lecturer],
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

  async function handleSave(intent: SaveIntent = 'save') {
    if (pendingAction !== null) return

    pendingAction = 'save'
    try {
      const validation = await validateForm({ update: true })
      if (!validation.valid) return

      // Superforms keeps the broad initialization type even after successful validation.
      const validatedFormData = validation.data as ScheduleEntryFormData

      if (intent === 'duplicate') {
        if (mode.id === 'edit') {
          const current = createCurrentEntry(mode.entry.seriesId, validatedFormData)
          mode.onDuplicate(current)
        }
        return
      }

      switch (mode.id) {
        case 'create': {
          // creating new entry
          const current = createCurrentEntry(
            mode.prefilled?.seriesId ?? crypto.randomUUID(),
            validatedFormData
          )
          await mode.onCreate(createRepeatedEntries(current))
          break
        }
        case 'edit': {
          // editing existing entry
          const current = createCurrentEntry(mode.entry.seriesId, validatedFormData)
          if (hasActualChanges(current, $state.snapshot(mode.entry))) {
            // did changes, update new entry
            await requestUpdate({ id: mode.entry.id, ...current })
          } else {
            // no changes, close dialog
            onClose()
          }
          break
        }
        case 'duplicate': {
          // creating new entry
          const current = createCurrentEntry(mode.entry.seriesId, validatedFormData)
          const duplicates = duplicateEntries(current)
          if (duplicates.length > 0) {
            await mode.onCreate(duplicates)
          } else {
            // no duplicates, close dialog
            onClose()
          }
          break
        }
      }
    } finally {
      pendingAction = null
    }
  }

  async function handleDelete() {
    if (mode.id !== 'edit' || pendingAction !== null) return

    pendingAction = 'delete'
    try {
      await mode.onDelete(mode.entry.id)
    } finally {
      pendingAction = null
    }
  }

  function hasFocusedControl(): boolean {
    const activeElement = document.activeElement
    return (
      activeElement instanceof HTMLElement &&
      activeElement !== document.body &&
      activeElement !== dialogContentRef
    )
  }

  let poDialogOpen = $state(false)

  /** Prefills the form with the lecturers and POs for the given module */
  async function prefillForm(module: string) {
    try {
      $formData.lecturer = []
      $formData.pos = []

      const [lecturer, pos] = await Promise.allSettled([getLecturers(module), getPOs(module)])
      if (lecturer.status === 'fulfilled' && $formData.module === module) {
        $formData.lecturer = lecturer.value
      }
      if (pos.status === 'fulfilled' && $formData.module === module) {
        $formData.pos = mergePOs(pos.value)
      }
    } catch {
      // Just swallow the error, it's not critical
    }
  }
</script>

<svelte:window
  onkeydown={(e) => {
    if (
      e.key === 'Delete' &&
      !e.repeat &&
      mode.id === 'edit' &&
      !hasFocusedControl() &&
      !poDialogOpen &&
      !updateScopeDialogOpen
    ) {
      e.preventDefault()
      void handleDelete()
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
  <Dialog.Content
    bind:ref={dialogContentRef}
    tabindex={-1}
    class="grid max-h-[min(90dvh,920px)] min-h-0 max-w-2xl grid-rows-[auto_auto_minmax(0,1fr)_auto_auto_auto] overflow-hidden max-sm:top-4 max-sm:translate-y-0 sm:top-[50%] sm:translate-y-[-50%]"
    showClose={false}
    onOpenAutoFocus={(e) => {
      e.preventDefault()
      dialogContentRef?.focus()
    }}
  >
    <Dialog.Header class="shrink-0 space-y-0">
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
                {#snippet child({ props })}
                  <Button
                    {...props}
                    type="button"
                    variant="ghost"
                    size="icon"
                    class="text-muted-foreground hover:text-foreground size-8"
                    disabled={pendingAction !== null}
                    onclick={() => handleSave('duplicate')}
                  >
                    <Copy class="size-4" />
                    <span class="sr-only">Eintrag duplizieren</span>
                  </Button>
                {/snippet}
              </Tooltip.Trigger>
              <Tooltip.Content>Eintrag duplizieren</Tooltip.Content>
            </Tooltip.Root>

            <Tooltip.Root>
              <Tooltip.Trigger>
                {#snippet child({ props })}
                  <Button
                    {...props}
                    type="button"
                    variant="ghost"
                    size="icon"
                    class="text-muted-foreground hover:bg-destructive/10 hover:text-destructive size-8"
                    disabled={pendingAction !== null}
                    onclick={handleDelete}
                  >
                    <Trash2 class="size-4" />
                    <span class="sr-only">Eintrag löschen</span>
                  </Button>
                {/snippet}
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

    <Separator class="my-1 shrink-0" />

    <div
      class="dialog-body-scroll min-h-0 min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain pr-1"
    >
      <div class="space-y-4 py-2">
        <!-- Module -->
        <ModuleSingleSelect
          disabled={mode.id !== 'create'}
          {form}
          {errors}
          name="module"
          label="Modul"
          placeholder="Modul auswählen…"
          options={schedulePlanningFilter.modules}
          bind:value={$formData.module}
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
          <ScheduleEntryPoField
            {form}
            bind:value={$formData.pos}
            bind:subDialogOpen={poDialogOpen}
            studyPrograms={schedulePlanningFilter.studyProgramsWithSpecialization}
          />
        {/if}
      </div>
    </div>

    <Separator class="my-1 shrink-0" />

    {#if updateScopeErrorMessage}
      <div
        class="border-destructive/30 bg-destructive/10 flex shrink-0 gap-2 rounded-md border p-2"
      >
        <TriangleAlert class="text-destructive mt-0.5 size-4 shrink-0" />
        <p class="text-destructive text-sm">{updateScopeErrorMessage}</p>
      </div>
    {/if}

    <Dialog.Footer class="shrink-0 gap-2">
      <Dialog.Close
        disabled={pendingAction !== null}
        class={buttonVariants({ variant: 'outline' })}
      >
        Abbrechen
      </Dialog.Close>
      <Button
        type="button"
        onclick={() => handleSave()}
        disabled={saveButtonDisabled}
        aria-busy={pendingAction === 'save'}
      >
        {pendingAction === 'save' ? 'Speichert…' : 'Speichern'}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

{#if mode.id === 'edit'}
  <ScheduleEntryUpdateScopeDialog
    bind:this={updateScopeDialog}
    bind:open={updateScopeDialogOpen}
    onUpdate={mode.onUpdate}
    getSeries={mode.getSeries}
  />
{/if}
