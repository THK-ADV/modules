<script lang="ts">
  import type { StudyProgram } from '$lib/types/study-program'
  import { Book, Eye } from '@lucide/svelte'
  import type { Action } from './studyProgram-table-actions.svelte'
  import StudyProgramTableActions from './studyProgram-table-actions.svelte'

  const FEATURE_FLAG_CREATE_MODULE_CATALOG_PO = ['ing_een5', 'ing_gme5', 'ing_wiw5']

  let {
    studyProgram,
    onClickModuleCreate,
    onClickModulePreview
  }: {
    studyProgram: StudyProgram
    onClickModuleCreate: (sp: StudyProgram) => void
    onClickModulePreview: (sp: StudyProgram) => void
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

    // TODO: this is a temporary solution to preview the module catalog creation
    if (FEATURE_FLAG_CREATE_MODULE_CATALOG_PO.includes(studyProgram.po.id)) {
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
    }

    return actions
  }

  const actions = createActions()
</script>

<StudyProgramTableActions {actions} />
