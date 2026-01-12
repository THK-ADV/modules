<script lang="ts" module>
  type Tab = 'module-catalog' | 'exam-list' | 'exam-load'

  export const SELECTED_TAB_COOKIE_NAME = 'studyprogram:selected-tab'
  export const SELECTED_TAB_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

  function fmtStudyProgram(studyProgram: StudyProgram) {
    if (studyProgram.specialization) {
      return `${studyProgram.deLabel} ${studyProgram.specialization.deLabel} (${studyProgram.degree.deLabel})`
    }
    return `${studyProgram.deLabel} (${studyProgram.degree.deLabel})`
  }

  const dateFormatter = new DateFormatter('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  const dateTimeFormatter = new DateFormatter('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  function fmtSemester(semester: Semester) {
    return `${semester.abbrev.toUpperCase()} ${semester.year}`
  }

  function fmtExamListPublishDate(examList: ExamList) {
    return `${dateFormatter.format(new Date(examList.date))} (${fmtSemester(examList.semester)})`
  }
</script>

<script lang="ts">
  import ErrorMessage from '$lib/components/error-message.svelte'
  import SuccessMessage from '$lib/components/success-message.svelte'
  import { renderComponent } from '$lib/components/ui/data-table/index.js'
  import LoadingOverlay from '$lib/components/ui/loading-overlay/loading-overlay.svelte'
  import * as Tabs from '$lib/components/ui/tabs/index.js'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'
  import { previewExamList, previewExamLoad } from '$lib/preview-action'
  import type { ExamList } from '$lib/types/exam-list'
  import type { Semester } from '$lib/types/semester'
  import type { StudyProgram } from '$lib/types/study-program'
  import { DateFormatter } from '@internationalized/date'
  import { FlaskConical } from '@lucide/svelte'
  import type { ColumnDef } from '@tanstack/table-core'
  import type { PageProps } from './$types'
  import ExamListReleaseDialog from './(components)/exam-list-release-dialog.svelte'
  import ExamListTableActions from './(components)/exam-list-table-actions.svelte'
  import ExamLoadTableActions from './(components)/exam-load-table-actions.svelte'
  import ModuleCatalogCreateDialog from './(components)/module-catalog-create-dialog.svelte'
  import ModuleCatalogTableActions from './(components)/module-catalog-table-actions.svelte'
  import ModuleCatalogUploadIntroDialog from './(components)/module-catalog-upload-intro-dialog.svelte'
  import StudyProgramTableStatus from './(components)/studyProgram-table-status.svelte'
  import StudyProgramTable from './(components)/studyProgram-table.svelte'
  import type { StudyProgramMangerInfo } from './+page.server'
  import { resolve } from '$app/paths'

  let { data }: PageProps = $props()

  let showExamListReleaseDialog: StudyProgram | undefined = $state(undefined)
  let showModuleCatalogCreateDialog: StudyProgram | undefined = $state(undefined)
  let showModuleCatalogIntroductionUploadDialog: StudyProgram | undefined = $state(undefined)
  let showErrorMessage: string | undefined = $state(undefined)
  let showSuccessMessage: string | undefined = $state(undefined)
  let isPublishing = $state(false)
  let isPreviewing = $state(false)
  // Tab handling

  let selectedTab: Tab = $derived((data.selectedTab || 'module-catalog') as Tab)

  function updateSelectedTab(value: string) {
    document.cookie = `${SELECTED_TAB_COOKIE_NAME}=${value}; path=/; max-age=${SELECTED_TAB_COOKIE_MAX_AGE}`
  }

  const columns: ColumnDef<StudyProgramMangerInfo>[] = $derived.by(() => {
    let cols: ColumnDef<StudyProgramMangerInfo>[] = [
      {
        accessorKey: 'title',
        header: 'Studiengang',
        cell: ({ row }) => fmtStudyProgram(row.original.studyProgram)
      },
      {
        accessorKey: 'po',
        header: 'Prüfungsordnung',
        cell: ({ row }) => row.original.studyProgram.po.version
      }
    ]

    switch (selectedTab) {
      case 'module-catalog':
        return [
          ...cols,
          {
            accessorKey: 'module-catalog-intro-upload-info',
            header: 'Einleitung hochgeladen am',
            cell: ({ row }) => {
              const badgeContent = row.original.moduleCatalogIntroLastModified
                ? dateTimeFormatter.format(row.original.moduleCatalogIntroLastModified)
                : undefined
              return renderComponent(StudyProgramTableStatus, {
                badgeContent,
                tooltipBadge: () =>
                  'Bei der Vorschau oder Erstellung des Modulhandbuchs wird die aktuelle Einleitung verwendet. Diese kann jederzeit ausgetauscht werden.',
                tooltipPending: () =>
                  'Die Einleitung des Modulhandbuchs (Prolog Teil) wurde noch nicht hochgeladen. Hierfür auf "Einleitung hochladen" klicken.'
              })
            }
          },
          {
            id: 'module-catalog-actions',
            cell: ({ row }) => {
              return renderComponent(ModuleCatalogTableActions, {
                studyProgram: row.original.studyProgram,
                canCreate: row.original.canCreate,
                onClickModuleCreate: (sp: StudyProgram) => {
                  showModuleCatalogCreateDialog = sp
                  isPreviewing = false
                },
                onClickModulePreview: (sp: StudyProgram) => {
                  showModuleCatalogCreateDialog = sp
                  isPreviewing = true
                },
                onClickModuleIntroductionUpload: (sp: StudyProgram) => {
                  showModuleCatalogIntroductionUploadDialog = sp
                  isPreviewing = false
                }
              })
            }
          }
        ]
      case 'exam-list':
        return [
          ...cols,
          {
            accessorKey: 'exam-list-publish-info',
            header: 'Veröffentlicht am',
            cell: ({ row }) => {
              const badgeContent = row.original.examList
                ? fmtExamListPublishDate(row.original.examList)
                : undefined
              return renderComponent(StudyProgramTableStatus, {
                badgeContent,
                tooltipBadge: () =>
                  'Die Prüfungsliste wurde vom Prüfungsausschuss für das Semester freigegeben und ist unter "Prüfungslisten" für alle öffentlich zugänglich. Diese kann jederzeit überschrieben werden.',
                tooltipPending: () =>
                  'Die Prüfungsliste wurde noch nicht freigegeben. Hierfür auf "Freigabe" klicken und das entsprechende Semester auswählen.'
              })
            }
          },
          {
            id: 'exam-list-actions',
            cell: ({ row }) => {
              return renderComponent(ExamListTableActions, {
                studyProgram: row.original.studyProgram,
                canCreate: row.original.canCreate,
                onClickExamListRelease: (sp: StudyProgram) => {
                  showExamListReleaseDialog = sp
                  isPreviewing = false
                },
                onClickExamListPreview: async (sp: StudyProgram) => {
                  isPreviewing = true
                  await previewExamList(sp)
                }
              })
            }
          }
        ]
      case 'exam-load':
        return [
          ...cols,
          {
            id: 'exam-load-actions',
            cell: ({ row }) => {
              return renderComponent(ExamLoadTableActions, {
                studyProgram: row.original.studyProgram,
                onClickExamLoadPreview: async (sp: StudyProgram) => {
                  isPreviewing = true
                  await previewExamLoad(sp)
                }
              })
            }
          }
        ]
    }
  })
</script>

<LoadingOverlay show={isPublishing} message="Prüfungsliste wird freigegeben…" />

<ErrorMessage bind:message={showErrorMessage} />

<SuccessMessage bind:message={showSuccessMessage} />

<ExamListReleaseDialog
  semesters={data.semesters}
  bind:showExamListReleaseDialog
  bind:isPublishing
  bind:showErrorMessage
/>

<ModuleCatalogCreateDialog bind:showModuleCatalogCreateDialog isPreview={isPreviewing} />

<ModuleCatalogUploadIntroDialog
  bind:showModuleCatalogIntroductionUploadDialog
  bind:showSuccessMessage
  bind:showErrorMessage
/>

<div class="flex h-full flex-1 flex-col space-y-8">
  <div class="space-y-2">
    <h2 class="text-3xl font-bold tracking-tight">
      Verwaltung von Modulhandbüchern und Prüfungslisten
    </h2>
    <p class="text-muted-foreground text-sm">
      Als PAV oder SGL können hier die <span class="font-bold">aktuellsten Versionen</span> von Modulhandbüchern
      und Prüfungslisten eingesehen werden. Für die Vorschau werden ausschließlich aktive Module verwendet.
    </p>
    <p class="text-muted-foreground text-sm">
      Zudem können die Einleitung des Modulhandbuchs (Prolog Teil) hochgeladen werden. Diese wird
      bei der Vorschau und Erstellung des Modulhandbuchs verwendet.
    </p>
  </div>
  <div class="space-y-4">
    <Tabs.Root bind:value={selectedTab} onValueChange={updateSelectedTab}>
      <Tabs.List>
        <Tabs.Trigger value="module-catalog">Modulhandbücher</Tabs.Trigger>
        <Tabs.Trigger value="exam-list">Prüfungslisten</Tabs.Trigger>
        <Tabs.Trigger value="exam-load">
          <span class="flex items-center gap-1.5">
            Prüfungslast
            <Tooltip.Provider>
              <Tooltip.Root>
                <Tooltip.Trigger>
                  <FlaskConical class="text-muted-foreground size-4" />
                </Tooltip.Trigger>
                <Tooltip.Content>
                  <p class="text-sm">Experimentell</p>
                </Tooltip.Content>
              </Tooltip.Root>
            </Tooltip.Provider>
          </span>
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="exam-list" class="ml-1">
        <p class="text-muted-foreground text-sm">
          PAVs haben darüber hinaus die Möglichkeit, Prüfungslisten für <span class="font-bold"
            >alle öffentlich freizugeben</span
          >. Hierfür wird ein Datum der Freigabe und ein Semester, für die die Prüfungsliste gilt,
          ausgewählt. Die PDF wird anschließend unter
          <a href={resolve('/exam-lists')} class="text-primary underline hover:no-underline"
            >Prüfungslisten</a
          >
          veröffentlicht. Pro Studiengang, PO und Semester kann es nur eine Prüfungsliste geben. Erneute
          Freigaben überschreiben die vorherige Prüfungsliste.
        </p>
      </Tabs.Content>
      <Tabs.Content value="module-catalog" class="ml-1">
        <p class="text-muted-foreground text-sm">
          Für die Vorschau und Erstellung von Modulhandbüchern können bestimmte Module
          <span class="font-bold">ausgeschlossen</span> werden.
        </p>
      </Tabs.Content>
      <Tabs.Content value="exam-load" class="ml-1">
        <p class="text-muted-foreground text-sm">
          Erzeugt die Prüfungslast als CSV. Achtung: Diese Funktion ist experimentell. Feedback ist
          sehr erwünscht!
        </p>
      </Tabs.Content>
    </Tabs.Root>
    <StudyProgramTable data={data.studyProgramMangerInfo} {columns} />
  </div>
</div>
