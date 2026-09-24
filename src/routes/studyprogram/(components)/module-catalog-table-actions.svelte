<script lang="ts">
  import { resolve } from '$app/paths'
  import { Button } from '$lib/components/ui/button'
  import type { StudyProgram } from '$lib/types/study-program'
  import { ArrowRight } from '@lucide/svelte'

  let { studyProgram }: { studyProgram: StudyProgram } = $props()
</script>

<Button
  href={resolve('/studyprogram/[poId]', { poId: studyProgram.po.id })}
  variant="outline"
  size="sm"
  class="border-gray-300 font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:text-gray-800"
>
  <ArrowRight />
  Öffnen
</Button>
