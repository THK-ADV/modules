<script lang="ts">
  import MarkdownEditor from '$lib/components/markdown-editor.svelte'
  import MarkdownHelp from '$lib/components/markdown-help.svelte'
  import MarkdownHint from '$lib/components/markdown-hint.svelte'
  import { getModuleFormContext } from '../context'
  import type { PageProps } from './$types'

  const { data }: PageProps = $props()

  // svelte-ignore state_referenced_locally
  const deContentStatus = data.fieldStatuses?.['deContent.teachingAndLearningMethods']
  // svelte-ignore state_referenced_locally
  const enContentStatus = data.fieldStatuses?.['enContent.teachingAndLearningMethods']

  const form = getModuleFormContext()
  const { form: formData, errors } = form

  let deContent = {
    get value() {
      return $formData.deContent.teachingAndLearningMethods ?? ''
    },
    set value(newValue: string) {
      if (!$formData.deContent) {
        $formData.deContent = {
          learningOutcome: '',
          content: '',
          teachingAndLearningMethods: '',
          recommendedReading: '',
          particularities: ''
        }
      }
      $formData.deContent.teachingAndLearningMethods = newValue
    }
  }

  let enContent = {
    get value() {
      return $formData.enContent.teachingAndLearningMethods ?? ''
    },
    set value(newValue: string) {
      if (!$formData.enContent) {
        $formData.enContent = {
          learningOutcome: '',
          content: '',
          teachingAndLearningMethods: '',
          recommendedReading: '',
          particularities: ''
        }
      }
      $formData.enContent.teachingAndLearningMethods = newValue
    }
  }
</script>

<div class="space-y-8">
  <div class="space-y-4">
    <div class="space-y-2 border-b pb-4">
      <h3 class="text-foreground text-lg font-medium">Lehr- und Lernmethoden</h3>
      <p class="text-muted-foreground text-sm">Die Lehr- und Lernmethoden des Moduls.</p>
      <MarkdownHint />
      <MarkdownHelp />
    </div>
  </div>

  <div class="space-y-4">
    <MarkdownEditor
      {form}
      name="deContent.teachingAndLearningMethods"
      label="Deutsch"
      description="Die Lehr- und Lernmethoden des Moduls in deutscher Sprache."
      placeholder="- Beamergestützte Vorlesung…"
      bind:value={deContent.value}
      {errors}
      modificationStatus={deContentStatus}
    />

    <MarkdownEditor
      {form}
      name="enContent.teachingAndLearningMethods"
      label="English"
      description="The Teaching and Learning Methods of the module in English."
      placeholder="- Lecture supported by slides…"
      bind:value={enContent.value}
      {errors}
      modificationStatus={enContentStatus}
    />
  </div>
</div>
