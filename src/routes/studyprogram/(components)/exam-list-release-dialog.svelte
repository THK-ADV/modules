<script lang="ts" module>
  interface Props {
    semesters: Semester[]
    showExamListReleaseDialog: StudyProgram | undefined
    isPublishing: boolean
    showErrorMessage: string | undefined
  }

  function fmtStudyProgram(studyProgram: StudyProgram) {
    if (studyProgram.specialization) {
      return `${studyProgram.deLabel} ${studyProgram.specialization.deLabel} (${studyProgram.degree.deLabel})`
    }
    return `${studyProgram.deLabel} (${studyProgram.degree.deLabel})`
  }
</script>

<script lang="ts">
  import { invalidate } from '$app/navigation'
  import Combobox from '$lib/components/combobox.svelte'
  import { Button, buttonVariants } from '$lib/components/ui/button/index.js'
  import { Calendar } from '$lib/components/ui/calendar/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import * as Form from '$lib/components/ui/form/index.js'
  import * as Popover from '$lib/components/ui/popover/index.js'
  import type { Semester } from '$lib/types/semester'
  import type { StudyProgram } from '$lib/types/study-program'
  import { cn } from '$lib/utils'
  import { DateFormatter, fromDate, getLocalTimeZone } from '@internationalized/date'
  import CalendarIcon from '@lucide/svelte/icons/calendar'
  import { superForm } from 'sveltekit-superforms'
  import { zod4Client } from 'sveltekit-superforms/adapters'
  import { z } from 'zod'

  let {
    semesters,
    showExamListReleaseDialog = $bindable(),
    isPublishing = $bindable(),
    showErrorMessage = $bindable()
  }: Props = $props()

  const df = new DateFormatter('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  const semesterOptions = $derived(
    semesters.map((s) => ({
      id: s.id,
      deLabel: `${s.deLabel} ${s.year}`
    }))
  )

  function createDialogForm() {
    const schema = z.object({
      semester: z.string().nonempty('Semester ist erforderlich'),
      releaseDate: z.date({ error: 'Datum ist erforderlich' })
    })

    return superForm(
      {
        semester: semesters[0].id,
        releaseDate: new Date()
      },
      {
        SPA: true,
        validators: zod4Client(schema)
      }
    )
  }

  const dialogForm = createDialogForm()
  const { form: dialogFormData, errors: dialogErrors, reset, validate } = dialogForm

  function closeDialog() {
    showExamListReleaseDialog = undefined
    reset() // resets the form to it's initial state
  }

  async function handleSubmit() {
    const sp = showExamListReleaseDialog
    const semester = $dialogFormData.semester
    const date = $dialogFormData.releaseDate

    closeDialog()

    const semesterErr = await validate('semester')
    const releaseDateErr = await validate('releaseDate')

    if (!sp || semesterErr !== undefined || releaseDateErr !== undefined) {
      return
    }

    isPublishing = true

    const response = await fetch(`/actions/publish`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ semester, date, po: sp.po.id, studyProgram: sp.id })
    })

    isPublishing = false

    if (response.ok) {
      await invalidate('preview:studyProgram')
    } else {
      const err = await response.json()
      showErrorMessage = err.message || 'Unbekannter Fehler beim Freigeben der Prüfungsliste'
    }
  }
</script>

<Dialog.Root
  open={showExamListReleaseDialog !== undefined}
  onOpenChange={(open) => {
    if (!open) {
      closeDialog()
    }
  }}
>
  <Dialog.Content class="max-w-lg">
    <Dialog.Header>
      <Dialog.Title class="text-lg font-semibold"
        >Prüfungsliste freigeben für {showExamListReleaseDialog &&
          fmtStudyProgram(showExamListReleaseDialog)}</Dialog.Title
      >
      <Dialog.Description
        >Zur Freigabe der Prüfungsliste werden folgende Informationen benötigt:</Dialog.Description
      >
    </Dialog.Header>

    <div class="space-y-4 py-4">
      <!-- Semester Selection -->
      <Combobox
        form={dialogForm}
        name="semester"
        label="Semester"
        placeholder="Semester auswählen…"
        description="Das Semester, für das die Prüfungsliste gilt."
        options={semesterOptions}
        bind:value={$dialogFormData.semester}
        errors={$dialogErrors}
      />

      <!-- Release Date Selection -->
      <Form.Field form={dialogForm} name="releaseDate">
        <Popover.Root>
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>Freigabe Datum</Form.Label>
              <Popover.Trigger
                class={cn(
                  buttonVariants({ variant: 'outline' }),
                  'w-full justify-start text-left font-normal',
                  !$dialogFormData.releaseDate && 'text-muted-foreground',
                  $dialogErrors.releaseDate && 'border-destructive'
                )}
                {...props}
              >
                <CalendarIcon class="mr-2 size-4" />
                {$dialogFormData.releaseDate
                  ? df.format($dialogFormData.releaseDate)
                  : 'Datum auswählen…'}
              </Popover.Trigger>
              <input hidden value={$dialogFormData.releaseDate?.toISOString()} name={props.name} />
            {/snippet}
          </Form.Control>
          <Popover.Content class="w-auto p-0" align="start">
            <Calendar
              value={fromDate($dialogFormData.releaseDate, getLocalTimeZone())}
              type="single"
              initialFocus
              onValueChange={(value) => {
                // fallback to the latest value if the user cancels the selection
                if (value) {
                  $dialogFormData.releaseDate = value.toDate(getLocalTimeZone())
                }
              }}
            />
          </Popover.Content>
        </Popover.Root>
        <Form.Description
          >Das Datum, das auf der PDF als Freigabedatum angezeigt wird.</Form.Description
        >
        <Form.FieldErrors />
      </Form.Field>
    </div>

    <Dialog.Footer class="gap-2">
      <Button type="button" variant="outline" onclick={closeDialog}>Abbrechen</Button>
      <Button type="button" onclick={handleSubmit}>Freigeben</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
