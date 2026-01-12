<script lang="ts">
  import MarkdownEditor from '$lib/components/markdown-editor.svelte'
  import MarkdownHelp from '$lib/components/markdown-help.svelte'
  import MarkdownHint from '$lib/components/markdown-hint.svelte'
  import { getModuleFormContext } from '../context'
  import type { PageProps } from './$types'

  const { data }: PageProps = $props()

  // svelte-ignore state_referenced_locally
  const deContentStatus = data.fieldStatuses?.['deContent.recommendedReading']
  // svelte-ignore state_referenced_locally
  const enContentStatus = data.fieldStatuses?.['enContent.recommendedReading']

  const form = getModuleFormContext()
  const { form: formData, errors } = form

  let deContent = {
    get value() {
      return $formData.deContent.recommendedReading ?? ''
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
      $formData.deContent.recommendedReading = newValue
    }
  }

  let enContent = {
    get value() {
      return $formData.enContent.recommendedReading ?? ''
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
      $formData.enContent.recommendedReading = newValue
    }
  }
</script>

<div class="space-y-8">
  <div class="space-y-4">
    <div class="space-y-2 border-b pb-4">
      <h3 class="text-lg font-medium text-foreground">Empfohlene Literatur</h3>
      <p class="text-sm text-muted-foreground">Empfohlene Literatur für das Modul.</p>
      <MarkdownHint />
      <MarkdownHelp />
    </div>
  </div>

  <div class="space-y-4">
    <MarkdownEditor
      {form}
      name="deContent.recommendedReading"
      label="Deutsch"
      description="Die empfohlene Literatur des Moduls in deutscher Sprache."
      placeholder="- Autor. Titel. Jahr. Verlag."
      bind:value={deContent.value}
      {errors}
      modificationStatus={deContentStatus}
    />

    <MarkdownEditor
      {form}
      name="enContent.recommendedReading"
      label="English"
      description="The recommended literature of the module in English."
      placeholder="- Author. Title. Year. Publisher."
      bind:value={enContent.value}
      {errors}
      modificationStatus={enContentStatus}
    />
  </div>
</div>
