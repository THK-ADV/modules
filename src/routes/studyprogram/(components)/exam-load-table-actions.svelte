<script lang="ts">
  import type { StudyProgram } from '$lib/types/study-program'
  import { Eye } from '@lucide/svelte'
  import type { Action } from './studyProgram-table-actions.svelte'
  import StudyProgramTableActions from './studyProgram-table-actions.svelte'

  let {
    studyProgram,
    onClickExamLoadPreview
  }: {
    studyProgram: StudyProgram
    onClickExamLoadPreview: (sp: StudyProgram) => void
  } = $props()

  function createActions(): Action[] {
    return [
      {
        key: 'previewExamLoad',
        label: 'Vorschau',
        Icon: Eye,
        onclick: () => {
          onClickExamLoadPreview(studyProgram)
        },
        variant: 'outline',
        className: 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-800'
      }
    ]
  }

  const actions = createActions()
</script>

<StudyProgramTableActions {actions} />
