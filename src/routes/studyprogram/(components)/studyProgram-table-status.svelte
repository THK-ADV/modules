<script lang="ts">
  import { Badge } from '$lib/components/ui/badge'
  import type { ExamList } from '$lib/types/exam-list'
  import type { Semester } from '$lib/types/semester'
  import { DateFormatter } from '@internationalized/date'
  import { CircleCheckIcon, LoaderCircleIcon } from '@lucide/svelte'

  let { examList }: { examList: ExamList | undefined } = $props()

  const df = new DateFormatter('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  function fmtSemester(semester: Semester) {
    return `${semester.abbrev.toUpperCase()} ${semester.year}`
  }
</script>

{#if examList}
  <Badge variant="outline" class="gap-1.5 text-muted-foreground">
    <CircleCheckIcon
      class="h-4 w-4 fill-green-600 stroke-white dark:fill-green-400 dark:stroke-white"
    />
    <span class="hidden lg:inline"
      >{df.format(new Date(examList.date))} ({fmtSemester(examList.semester)})</span
    >
  </Badge>
{:else}
  <Badge variant="outline" class="gap-1.5 text-muted-foreground">
    <LoaderCircleIcon class="h-3.5 w-3.5 stroke-muted-foreground" />
    <span class="hidden lg:inline">Ausstehend</span>
  </Badge>
{/if}
