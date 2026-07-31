<script lang="ts">
  import type { StudyProgram } from '$lib/types/study-program'
  import { Upload } from '@lucide/svelte'
  import type { Action } from './studyProgram-table-actions.svelte'
  import StudyProgramTableActions from './studyProgram-table-actions.svelte'

  let {
    studyProgram,
    canCreate,
    onClickModuleIntroductionUpload
  }: {
    studyProgram: StudyProgram
    canCreate: boolean
    onClickModuleIntroductionUpload: (sp: StudyProgram) => void
  } = $props()

  const actions: Action[] = [
    {
      key: 'uploadModuleCatalogIntroduction',
      label: 'Einleitung hochladen',
      Icon: Upload,
      onclick: () => {
        onClickModuleIntroductionUpload(studyProgram)
      },
      variant: 'outline',
      className: 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-800'
    }
  ]
</script>

{#if canCreate}
  <StudyProgramTableActions {actions} />
{/if}
