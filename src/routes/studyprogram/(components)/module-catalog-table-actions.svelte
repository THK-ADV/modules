<script lang="ts">
  import type { StudyProgram } from '$lib/types/study-program'
  import { Book, Eye, Upload } from '@lucide/svelte'
  import type { Action } from './studyProgram-table-actions.svelte'
  import StudyProgramTableActions from './studyProgram-table-actions.svelte'

  let {
    studyProgram,
    canCreate,
    onClickModuleCreate,
    onClickModulePreview,
    onClickModuleIntroductionUpload
  }: {
    studyProgram: StudyProgram
    canCreate: boolean
    onClickModuleCreate: (sp: StudyProgram) => void
    onClickModulePreview: (sp: StudyProgram) => void
    onClickModuleIntroductionUpload: (sp: StudyProgram) => void
  } = $props()

  function createActions(): Action[] {
    const actions = new Array<Action>({
      key: 'previewModuleCatalog',
      label: 'Vorschau',
      Icon: Eye,
      onclick: () => {
        onClickModulePreview(studyProgram)
      },
      variant: 'outline',
      className: 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-800'
    })

    if (canCreate) {
      actions.push({
        key: 'createModuleCatalog',
        label: 'Erstellen',
        Icon: Book,
        onclick: () => {
          onClickModuleCreate(studyProgram)
        },
        variant: 'outline',
        className: 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-800'
      })

      actions.push({
        key: 'uploadModuleCatalogIntroduction',
        label: 'Einleitung hochladen',
        Icon: Upload,
        onclick: () => {
          onClickModuleIntroductionUpload(studyProgram)
        },
        variant: 'outline',
        className: 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-800'
      })
    }

    return actions
  }

  const actions = createActions()
</script>

<StudyProgramTableActions {actions} />
