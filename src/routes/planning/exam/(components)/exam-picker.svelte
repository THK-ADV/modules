<script lang="ts">
  import type { ExamChoice } from '$lib/schemas/exams'
  import { getExamChoices } from '../exams/exams.remote'
  import OptionPicker from './option-picker.svelte'

  let {
    id,
    selected,
    label,
    onSelect
  }: {
    id: string
    selected: string | undefined
    /** Trigger text naming the selected exam. */
    label: string
    onSelect: (exam: ExamChoice) => void
  } = $props()

  /** All exams, loaded only while a creation form shows this picker. */
  const exams = $derived(new Map((await getExamChoices()).map((e) => [e.id, e])))
  const options = $derived(
    [...exams.values()].map((e) => ({
      id: e.id,
      label: e.name,
      hint: e.modules.map((m) => m.abbrev).join(', '),
      keywords: e.modules.map((m) => m.title)
    }))
  )
</script>

<OptionPicker
  {id}
  class="w-full"
  {options}
  selected={selected ? [selected] : []}
  onSelect={(exam) => {
    const selection = exams.get(exam)
    if (selection) onSelect(selection)
  }}
  {label}
/>
