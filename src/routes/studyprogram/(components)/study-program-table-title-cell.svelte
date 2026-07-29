<script lang="ts">
  import { resolve } from '$app/paths'
  import type { StudyProgram } from '$lib/types/study-program'

  let { studyProgram }: { studyProgram: StudyProgram } = $props()

  const label = $derived.by(() => {
    if (studyProgram.specialization) {
      return `${studyProgram.deLabel} ${studyProgram.specialization.deLabel} (${studyProgram.degree.deLabel})`
    }
    return `${studyProgram.deLabel} (${studyProgram.degree.deLabel})`
  })
</script>

<a href={resolve('/studyprogram/[poId]', { poId: studyProgram.po.id })} title={label}>
  {label}
</a>
