<script lang="ts">
  import type { Role } from '$lib/types/role'
  import type { StudyProgram } from '$lib/types/study-program'
  import { Eye, FileCheck } from '@lucide/svelte'
  import type { Action } from './studyProgram-table-actions.svelte'
  import StudyProgramTableActions from './studyProgram-table-actions.svelte'

  let {
    studyProgram,
    roles,
    onClickExamListRelease,
    onClickExamListPreview
  }: {
    studyProgram: StudyProgram
    roles: Role[]
    onClickExamListRelease: (sp: StudyProgram) => void
    onClickExamListPreview: (sp: StudyProgram) => void
  } = $props()

  function createActions(): Action[] {
    const actions = new Array<Action>({
      key: 'previewExamList',
      label: 'Vorschau',
      Icon: Eye,
      onclick: () => {
        onClickExamListPreview(studyProgram)
      },
      variant: 'outline',
      className: 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-800'
    })

    if (roles.some(({ id }) => id === 'pav')) {
      actions.push({
        key: 'releaseExamList',
        label: 'Freigabe',
        Icon: FileCheck,
        onclick: () => {
          onClickExamListRelease(studyProgram)
        },
        variant: 'outline',
        className: 'border-green-400 text-green-600 hover:bg-green-50 hover:text-green-700'
      })
    }

    return actions
  }

  const actions = createActions()
</script>

<StudyProgramTableActions {actions} />
