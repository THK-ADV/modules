<script lang="ts">
  import { buttonVariants } from '$lib/components/ui/button/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import type { ExamEventProps } from '$lib/calendar'
  import { fmtTime, fmtWeekdayDate } from '$lib/formats'
  import type { StudyProgram } from '$lib/types/study-program'
  import { CalendarDays, Clock } from '@lucide/svelte'
  import ExamEntryFacts, { examSubtitle } from './exam-entry-facts.svelte'

  let {
    exam,
    studyPrograms,
    onClose
  }: { exam: ExamEventProps; studyPrograms: StudyProgram[]; onClose: () => void } = $props()

  const entry = $derived(exam.raw)
  let content = $state<HTMLElement | null>(null)
</script>

<Dialog.Root open={true} onOpenChange={(open) => !open && onClose()}>
  <Dialog.Content
    class="flex max-h-[90dvh] flex-col gap-0 p-0 sm:max-w-2xl"
    bind:ref={content}
    onOpenAutoFocus={(e) => {
      e.preventDefault()
      content?.focus()
    }}
  >
    <Dialog.Header class="gap-2 border-b px-6 py-4 pr-12">
      <Dialog.Title>{entry.examName}</Dialog.Title>
      <Dialog.Description
        >{examSubtitle(entry, exam.methodLabels, studyPrograms)}</Dialog.Description
      >
    </Dialog.Header>

    <div class="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6">
      <div class="bg-muted/50 flex flex-wrap items-center gap-4 rounded-lg px-4 py-2.5 text-sm">
        <span class="flex items-center gap-2 font-medium">
          <CalendarDays class="text-muted-foreground size-4" aria-hidden="true" />
          {fmtWeekdayDate(entry.start)}
        </span>
        <span class="flex items-center gap-2 font-medium">
          <Clock class="text-muted-foreground size-4" aria-hidden="true" />
          {fmtTime(entry.start)} – {fmtTime(entry.end)}
        </span>
      </div>

      <ExamEntryFacts {entry} {studyPrograms} />
    </div>

    <Dialog.Footer class="border-t px-6 py-4">
      <Dialog.Close class={buttonVariants({ variant: 'outline', size: 'sm' })}>
        Schließen
      </Dialog.Close>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
