<script lang="ts">
  // Note(BK4A9F): Structural and semantic twin of Note(BK4A9F) in
  // schedule-entry-edit-dialog.svelte. Keep dialog chrome, create/edit/duplicate
  // modes, form/repeat/save/delete flow, and field layout in sync. Domain-specific
  // differences (booking kind, title/note/metadata, teaching-only fields) are expected.
  import InputField from '$lib/components/input-field.svelte'
  import { ModuleSingleSelect } from '$lib/components/module-filter'
  import { Button, buttonVariants } from '$lib/components/ui/button/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import * as Form from '$lib/components/ui/form/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import { Separator } from '$lib/components/ui/separator/index.js'
  import { Switch } from '$lib/components/ui/switch/index.js'
  import { Textarea } from '$lib/components/ui/textarea/index.js'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'
  import { getErrorMessage } from '$lib/errors'
  import {
    otherBookingFormSchema,
    teachingBookingFormSchema,
    bookingFormSchema,
    type BookingFormData
  } from '$lib/schemas/booking'
  import { schedulePlanningFilter } from '$lib/stores/schedule-filter.svelte'
  import {
    BOOKING_KIND_LABELS,
    isTeachingKind,
    type BookingCreate,
    type BookingEdit,
    type BookingKind,
    type BookingMetadata
  } from '$lib/types/booking'
  import {
    arraysEqual,
    clonePOs,
    mergePOs,
    posEqual,
    type ScheduleEntryUpdateScope,
    type SeriesOccurrence
  } from '$lib/types/schedule'
  import { fromDate, getLocalTimeZone, type DateValue } from '@internationalized/date'
  import { Copy, Trash2, TriangleAlert } from '@lucide/svelte'
  import { superForm } from 'sveltekit-superforms'
  import { zod4 } from 'sveltekit-superforms/adapters'
  import Combobox from '../combobox.svelte'
  import DateTimePicker from '../forms/date-time-picker.svelte'
  import MultiSelectCombobox from '../multi-select-combobox.svelte'
  import Calendar from '../ui/calendar/calendar.svelte'
  import BookingMetadataView from './booking-metadata.svelte'
  import ScheduleEntryPoField from './schedule-entry-po-field.svelte'
  import ScheduleEntryUpdateScopeDialog from './schedule-entry-update-scope-dialog.svelte'
  import { getLecturers, getPOs } from './schedule.remote'

  type PendingAction = 'save' | 'delete'
  type SaveIntent = 'save' | 'duplicate'

  export interface Create {
    id: 'create'
    kind: BookingKind
    onCreate: (entries: BookingCreate[]) => Promise<void>
    prefilled?: { start: Date; end: Date }
  }

  export interface Edit {
    id: 'edit'
    entry: BookingEdit
    metadata: BookingMetadata
    getSeries: (seriesId: string) => Promise<SeriesOccurrence[]>
    onUpdate: (entry: BookingEdit, scope: ScheduleEntryUpdateScope) => Promise<void>
    onDuplicate: (entry: BookingCreate) => void
    onDelete: (id: string) => Promise<void>
  }

  export interface Duplicate {
    id: 'duplicate'
    entry: BookingCreate
    onCreate: (entries: BookingCreate[]) => Promise<void>
  }

  export type Mode = Create | Edit | Duplicate

  interface Props {
    mode: Mode
    onClose: () => void
    holidays: Date[]
  }

  let { mode, onClose, holidays }: Props = $props()

  const kind = $derived(mode.id === 'create' ? mode.kind : mode.entry.kind)
  const isTeaching = $derived(kind === 'teaching')

  function hasActualChanges(lhs: BookingCreate, rhs: BookingEdit): boolean {
    if (
      lhs.title !== rhs.title ||
      lhs.note !== rhs.note ||
      !arraysEqual(lhs.rooms, rhs.rooms) ||
      !arraysEqual(lhs.lecturer, rhs.lecturer) ||
      lhs.start.getTime() !== rhs.start.getTime() ||
      lhs.end.getTime() !== rhs.end.getTime()
    ) {
      return true
    }
    if (isTeachingKind(lhs) && isTeachingKind(rhs)) {
      return (
        lhs.module !== rhs.module ||
        lhs.courseType !== rhs.courseType ||
        !posEqual(lhs.po, mergePOs(rhs.po))
      )
    }
    return false
  }

  function createFormData(mode: Mode) {
    const entry = mode.id === 'create' ? null : mode.entry
    const prefilled = mode.id === 'create' ? mode.prefilled : undefined
    const teaching = entry && isTeachingKind(entry) ? entry : null
    return superForm(
      {
        kind,
        title: entry?.title ?? '',
        note: entry?.note ?? '',
        rooms: entry?.rooms ?? [],
        lecturer: entry?.lecturer ?? [],
        date: {
          start: entry?.start ?? prefilled?.start ?? null,
          end: entry?.end ?? prefilled?.end ?? null
        },
        module: teaching?.module ?? '',
        courseType: teaching?.courseType ?? '',
        pos: teaching ? mergePOs(teaching.po) : []
      },
      {
        SPA: true,
        dataType: 'json',
        validators: zod4(isTeaching ? teachingBookingFormSchema : otherBookingFormSchema),
        onChange: async (event) => {
          if (event.paths.includes('module')) {
            await prefillModuleFields(event.get('module'))
          }
        }
      }
    )
  }

  // Repeated date entries
  let repeatEntry = $derived(mode.id === 'duplicate')
  let repeatedEntries = $state<DateValue[]>([])
  let pendingAction = $state<PendingAction | null>(null)
  let dialogContentRef = $state<HTMLElement | null>(null)
  let poDialogOpen = $state(false)

  const saveButtonDisabled = $derived(
    pendingAction !== null || (mode.id === 'duplicate' && repeatedEntries.length === 0)
  )

  const form = $derived(createFormData(mode))
  const { form: formData, errors, validateForm } = $derived(form)

  // Proxies for the nested date fields
  let dateStart = {
    get value() {
      return $formData.date.start
    },
    set value(newValue: Date | null) {
      $formData.date.start = newValue
    }
  }

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

  const title = $derived(`Einzelbuchung: ${BOOKING_KIND_LABELS[kind]}`)

  const description = $derived.by(() => {
    switch (mode.id) {
      case 'create':
        return 'Neue Einzelbuchung anlegen.'
      case 'duplicate':
        return 'Neue Buchung basierend auf der ausgewählten Buchung anlegen.'
      case 'edit':
        return 'Bestehende Buchung bearbeiten und anpassen.'
    }
  })

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

  const contactOptions = schedulePlanningFilter.identities.map((i) => ({
    id: i.id,
    label: i.label,
    abbrev: i.label
  }))

  function createCurrentEntry(seriesId: string, data: BookingFormData): BookingCreate {
    const base = {
      seriesId,
      title: data.title.trim(),
      note: data.note.trim() || null,
      rooms: [...data.rooms],
      lecturer: [...data.lecturer],
      start: new Date(data.date.start),
      end: new Date(data.date.end)
    }
    if (isTeachingKind(data)) {
      return {
        ...base,
        kind: 'teaching',
        module: data.module,
        courseType: data.courseType,
        po: clonePOs(data.pos)
      }
    }
    return { ...base, kind: data.kind }
  }

  /** Copies the entry to the given day, keeping the local time of day. */
  function onDate(entry: BookingCreate, date: DateValue): BookingCreate {
    const start = new Date(
      date.year,
      date.month - 1,
      date.day,
      entry.start.getHours(),
      entry.start.getMinutes()
    )
    const end = new Date(
      date.year,
      date.month - 1,
      date.day,
      entry.end.getHours(),
      entry.end.getMinutes()
    )
    const copy = { ...entry, start, end, rooms: [...entry.rooms], lecturer: [...entry.lecturer] }
    return isTeachingKind(copy) ? { ...copy, po: clonePOs(copy.po) } : copy
  }

  let updateScopeDialogOpen = $state(false)
  let updateScopeDialog: {
    requestUpdateScope: (entry: BookingEdit) => Promise<void>
  } | null = $state(null)
  let updateScopeErrorMessage = $state<string | undefined>(undefined)

  async function requestUpdate(entry: BookingEdit) {
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

  function createRepeatedEntries(current: BookingCreate): BookingCreate[] {
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
        continue
      }
      entries.push(onDate(current, date))
    }
    return entries
  }

  async function handleSave(intent: SaveIntent = 'save') {
    if (pendingAction !== null) return

    pendingAction = 'save'
    try {
      const validation = await validateForm({ update: true })
      if (!validation.valid) return

      const parsed = bookingFormSchema.safeParse(validation.data)
      if (!parsed.success) return
      const validatedFormData = parsed.data

      if (intent === 'duplicate') {
        if (mode.id === 'edit') {
          mode.onDuplicate(createCurrentEntry(mode.entry.seriesId, validatedFormData))
        }
        return
      }

      switch (mode.id) {
        case 'create': {
          const current = createCurrentEntry(crypto.randomUUID(), validatedFormData)
          await mode.onCreate(createRepeatedEntries(current))
          break
        }
        case 'edit': {
          const current = createCurrentEntry(mode.entry.seriesId, validatedFormData)
          if (hasActualChanges(current, $state.snapshot(mode.entry))) {
            await requestUpdate({ id: mode.entry.id, ...current })
          } else {
            onClose()
          }
          break
        }
        case 'duplicate': {
          const current = createCurrentEntry(mode.entry.seriesId, validatedFormData)
          if (repeatedEntries.length > 0) {
            await mode.onCreate(repeatedEntries.map((date) => onDate(current, date)))
          } else {
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

  /** Prefills lecturers and POs for the given module */
  async function prefillModuleFields(module: string) {
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
                    <span class="sr-only">Buchung duplizieren</span>
                  </Button>
                {/snippet}
              </Tooltip.Trigger>
              <Tooltip.Content>Buchung duplizieren</Tooltip.Content>
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
                    <span class="sr-only">Buchung löschen</span>
                  </Button>
                {/snippet}
              </Tooltip.Trigger>
              <Tooltip.Content
                >Buchung löschen <kbd
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
      class="dialog-body-scroll min-h-0 min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain px-1.5"
    >
      <div class="space-y-4 py-2">
        <InputField
          {form}
          errors={$errors}
          name="title"
          label="Titel"
          placeholder="Titel der Veranstaltung (max. 50 Zeichen)"
          maxlength={50}
          bind:value={$formData.title}
          disabled={mode.id === 'duplicate'}
        />

        {#if isTeaching}
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
        {/if}

        <MultiSelectCombobox
          {form}
          {errors}
          name="lecturer"
          label={isTeaching ? 'Dozierende' : 'Ansprechpersonen'}
          options={contactOptions}
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
              <Label for="repeat">Buchung duplizieren</Label>
            </div>
            {#if repeatEntry}
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

          {#if isTeaching}
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
          {/if}
        </div>

        {#if isTeaching && mode.id !== 'duplicate'}
          <ScheduleEntryPoField
            {form}
            bind:value={$formData.pos}
            bind:subDialogOpen={poDialogOpen}
            studyPrograms={schedulePlanningFilter.studyProgramsWithSpecialization}
          />
        {/if}

        <Form.Field {form} name="note">
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>Notiz (optional)</Form.Label>
              <Textarea
                {...props}
                bind:value={$formData.note}
                disabled={mode.id === 'duplicate'}
                rows={3}
              />
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>

        {#if mode.id === 'edit'}
          <BookingMetadataView
            createdBy={mode.metadata.createdBy}
            updatedAt={mode.metadata.updatedAt}
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
