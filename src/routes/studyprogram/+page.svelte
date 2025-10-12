<script lang="ts" module>
  import { renderComponent } from '$lib/components/ui/data-table/index.js'
  import type { ColumnDef } from '@tanstack/table-core'
  import StudyProgramTableActions from './(components)/studyProgram-table-actions.svelte'
  import StudyProgramTableStatus from './(components)/studyProgram-table-status.svelte'

  /**
   * This state variable is used to store the PO of the exam list that should be released.
   * It is set from within the StudyProgramTableActions component. I'm not sure if this is the best way to do this.
   */
  let showExamListReleaseDialog: StudyProgram | undefined = $state(undefined)

  function fmtStudyProgram(studyProgram: StudyProgram) {
    if (studyProgram.specialization) {
      return `${studyProgram.deLabel} ${studyProgram.specialization.deLabel} (${studyProgram.degree.deLabel})`
    }
    return `${studyProgram.deLabel} (${studyProgram.degree.deLabel})`
  }

  const columns: ColumnDef<StudyProgramMangerInfo>[] = [
    {
      accessorKey: 'title',
      header: 'Studiengang',
      cell: ({ row }) => fmtStudyProgram(row.original.studyProgram)
    },
    {
      accessorKey: 'po',
      header: 'Prüfungsordnung',
      cell: ({ row }) => row.original.studyProgram.po.version
    },
    {
      accessorKey: 'module-catalog-actions',
      header: 'Modulhandbuch',
      cell: ({ row }) => {
        return renderComponent(StudyProgramTableActions, {
          studyProgram: row.original.studyProgram,
          roles: row.original.roles,
          category: 'module-catalog'
        })
      }
    },
    {
      accessorKey: 'exam-list-actions',
      header: 'Prüfungsliste',
      cell: ({ row }) => {
        return renderComponent(StudyProgramTableActions, {
          studyProgram: row.original.studyProgram,
          roles: row.original.roles,
          category: 'exam-list',
          onClickRelease: (sp: StudyProgram) => {
            showExamListReleaseDialog = sp
          }
        })
      }
    },
    {
      accessorKey: 'exam-list-publish-info',
      header: 'Prüfungsliste Status',
      cell: ({ row }) => {
        return renderComponent(StudyProgramTableStatus, { examList: row.original.examList })
      }
    }
  ]
</script>

<script lang="ts">
  import { invalidate } from '$app/navigation'
  import Combobox from '$lib/components/combobox.svelte'
  import ErrorMessage from '$lib/components/error-message.svelte'
  import { Button, buttonVariants } from '$lib/components/ui/button/index.js'
  import { Calendar } from '$lib/components/ui/calendar/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import * as Form from '$lib/components/ui/form/index.js'
  import LoadingOverlay from '$lib/components/ui/loading-overlay/loading-overlay.svelte'
  import * as Popover from '$lib/components/ui/popover/index.js'
  import type { StudyProgram } from '$lib/types/study-program'
  import { cn } from '$lib/utils'
  import { DateFormatter, fromDate, getLocalTimeZone } from '@internationalized/date'
  import CalendarIcon from '@lucide/svelte/icons/calendar'
  import { superForm } from 'sveltekit-superforms'
  import { zodClient } from 'sveltekit-superforms/adapters'
  import { z } from 'zod'
  import type { PageProps } from './$types'
  import StudyProgramTable from './(components)/studyProgram-table.svelte'
  import type { StudyProgramMangerInfo } from './+page.server'

  let { data }: PageProps = $props()

  const semesterOptions = data.semesters.map((s) => ({
    id: s.id,
    deLabel: `${s.deLabel} ${s.year}`
  }))

  function createDialogForm() {
    const schema = z.object({
      semester: z.string().nonempty('Semester ist erforderlich'),
      releaseDate: z.date({ required_error: 'Datum ist erforderlich' })
    })

    return superForm(
      {
        semester: data.semesters[0].id,
        releaseDate: new Date()
      },
      {
        SPA: true,
        validators: zodClient(schema)
      }
    )
  }

  let showErrorMessage: string | undefined = $state(undefined)
  let isPublishing = $state(false)

  const dialogForm = createDialogForm()
  const { form: dialogFormData, errors: dialogErrors, reset, validate } = dialogForm

  const df = new DateFormatter('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

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

<LoadingOverlay show={isPublishing} message="Prüfungsliste wird freigegeben…" />

<ErrorMessage bind:message={showErrorMessage} title="Fehler beim Freigeben der Prüfungsliste" />

<div class="flex h-full flex-1 flex-col space-y-8">
  <div class="space-y-2">
    <h2 class="text-3xl font-bold tracking-tight">
      Verwaltung von Modulhandbüchern und Prüfungslisten
    </h2>
    <p class="text-sm text-muted-foreground">
      Als PAV oder SGL können hier die <span class="font-bold">aktuellsten Versionen</span> von Modulhandbüchern
      und Prüfungslisten eingesehen werden. Für die Vorschau werden ausschließlich aktive Module verwendet.
    </p>
    <p class="text-sm text-muted-foreground">
      PAVs haben darüber hinaus die Möglichkeit, Prüfungslisten für <span class="font-bold"
        >alle öffentlich freizugeben</span
      >. Hierfür wird ein Datum der Freigabe und ein Semester, für die die Prüfungsliste gilt,
      ausgewählt. Die PDF wird anschließend unter
      <a href="/exam-lists" class="text-primary underline hover:no-underline">Prüfungslisten</a> veröffentlicht.
      Pro Studiengang, PO und Semester kann es nur eine Prüfungsliste geben. Erneute Freigaben überschreiben
      die vorherige Prüfungsliste.
    </p>
  </div>
  <StudyProgramTable data={data.studyProgramMangerInfo} {columns} />
</div>

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
      <Dialog.Title
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
          >Das Datum, dass auf der PDF als Freigabedatum angezeigt wird.</Form.Description
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
