<script lang="ts">
  import Button from '$lib/components/ui/button/button.svelte'
  import type { ExamList } from '$lib/types/exam-list'
  import { Download } from '@lucide/svelte'

  let { examList }: { examList: ExamList } = $props()

  function showExamList() {
    window.open('/api/examLists/file/' + examList.url, '_blank', 'noopener,noreferrer')
  }
</script>

<Button
  variant="outline"
  size="sm"
  class="font-medium shadow-sm transition-colors"
  onclick={() => {
    showExamList()
  }}
>
  <Download class="size-4" />
  Öffnen
</Button>
