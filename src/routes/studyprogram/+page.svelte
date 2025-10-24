<script lang="ts" module>
  type Tab = 'module-catalog' | 'exam-list'

  export const SELECTED_TAB_COOKIE_NAME = 'studyprogram:selected-tab'
  export const SELECTED_TAB_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

  function fmtStudyProgram(studyProgram: StudyProgram) {
    if (studyProgram.specialization) {
      return `${studyProgram.deLabel} ${studyProgram.specialization.deLabel} (${studyProgram.degree.deLabel})`
    }
    return `${studyProgram.deLabel} (${studyProgram.degree.deLabel})`
  }
</script>

<script lang="ts">
  import ErrorMessage from '$lib/components/error-message.svelte'
  import { renderComponent } from '$lib/components/ui/data-table/index.js'
  import LoadingOverlay from '$lib/components/ui/loading-overlay/loading-overlay.svelte'
  import * as Tabs from '$lib/components/ui/tabs/index.js'
  import { previewExamList } from '$lib/preview-action'
  import type { StudyProgram } from '$lib/types/study-program'
  import type { ColumnDef } from '@tanstack/table-core'
  import type { PageProps } from './$types'
  import ExamListReleaseDialog from './(components)/exam-list-release-dialog.svelte'
  import ExamListTableActions from './(components)/exam-list-table-actions.svelte'
  import ModuleCatalogCreateDialog from './(components)/module-catalog-create-dialog.svelte'
  import ModuleCatalogTableActions from './(components)/module-catalog-table-actions.svelte'
  import StudyProgramTableStatus from './(components)/studyProgram-table-status.svelte'
  import StudyProgramTable from './(components)/studyProgram-table.svelte'
  import type { StudyProgramMangerInfo } from './+page.server'

  let { data }: PageProps = $props()

  let showExamListReleaseDialog: StudyProgram | undefined = $state(undefined)
  let showModuleCatalogCreateDialog: StudyProgram | undefined = $state(undefined)
  let showErrorMessage: string | undefined = $state(undefined)
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
            id: 'module-catalog-actions',
            cell: ({ row }) => {
              return renderComponent(ModuleCatalogTableActions, {
                studyProgram: row.original.studyProgram,
                onClickModuleCreate: (sp: StudyProgram) => {
                  showModuleCatalogCreateDialog = sp
                  isPreviewing = false
                },
                onClickModulePreview: (sp: StudyProgram) => {
                  showModuleCatalogCreateDialog = sp
                  isPreviewing = true
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
              return renderComponent(StudyProgramTableStatus, { examList: row.original.examList })
            }
          },
          {
            id: 'exam-list-actions',
            cell: ({ row }) => {
              return renderComponent(ExamListTableActions, {
                studyProgram: row.original.studyProgram,
                roles: row.original.roles,
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
    }
  })
</script>

<LoadingOverlay show={isPublishing} message="Prüfungsliste wird freigegeben…" />

<ErrorMessage bind:message={showErrorMessage} title="Fehler beim Freigeben der Prüfungsliste" />

<ExamListReleaseDialog
  semesters={data.semesters}
  bind:showExamListReleaseDialog
  bind:isPublishing
  bind:showErrorMessage
/>

<ModuleCatalogCreateDialog bind:showModuleCatalogCreateDialog isPreview={isPreviewing} />

<div class="flex h-full flex-1 flex-col space-y-8">
  <div class="space-y-2">
    <h2 class="text-3xl font-bold tracking-tight">
      Verwaltung von Modulhandbüchern und Prüfungslisten
    </h2>
    <p class="text-sm text-muted-foreground">
      Als PAV oder SGL können hier die <span class="font-bold">aktuellsten Versionen</span> von Modulhandbüchern
      und Prüfungslisten eingesehen werden. Für die Vorschau werden ausschließlich aktive Module verwendet.
    </p>
  </div>
  <div class="space-y-4">
    <Tabs.Root bind:value={selectedTab} onValueChange={updateSelectedTab}>
      <Tabs.List>
        <Tabs.Trigger value="module-catalog">Modulhandbücher</Tabs.Trigger>
        <Tabs.Trigger value="exam-list">Prüfungslisten</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="exam-list" class="ml-1">
        <p class="text-sm text-muted-foreground">
          PAVs haben darüber hinaus die Möglichkeit, Prüfungslisten für <span class="font-bold"
            >alle öffentlich freizugeben</span
          >. Hierfür wird ein Datum der Freigabe und ein Semester, für die die Prüfungsliste gilt,
          ausgewählt. Die PDF wird anschließend unter
          <a href="/exam-lists" class="text-primary underline hover:no-underline">Prüfungslisten</a>
          veröffentlicht. Pro Studiengang, PO und Semester kann es nur eine Prüfungsliste geben. Erneute
          Freigaben überschreiben die vorherige Prüfungsliste.
        </p>
      </Tabs.Content>
      <Tabs.Content value="module-catalog" class="ml-1">
        <p class="text-sm text-muted-foreground">
          Für die Vorschau und Erstellung von Modulhandbüchern können bestimmte Module
          <span class="font-bold">ausgeschlossen</span> werden.
        </p>
      </Tabs.Content>
    </Tabs.Root>
    <StudyProgramTable data={data.studyProgramMangerInfo} {columns} />
  </div>
</div>
