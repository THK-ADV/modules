<script lang="ts">
  import MarkdownEditor from '$lib/components/markdown-editor.svelte'
  import MarkdownHelp from '$lib/components/markdown-help.svelte'
  import MarkdownHint from '$lib/components/markdown-hint.svelte'
  import { getModuleFormContext } from '../context'
  import type { PageProps } from './$types'

  const { data }: PageProps = $props()

  // svelte-ignore state_referenced_locally
  const deContentStatus = data.fieldStatuses?.['deContent.particularities']
  // svelte-ignore state_referenced_locally
  const enContentStatus = data.fieldStatuses?.['enContent.particularities']

  const form = getModuleFormContext()
  const { form: formData, errors } = form

  let deContent = {
    get value() {
      return $formData.deContent.particularities ?? ''
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
      $formData.deContent.particularities = newValue
    }
  }

  let enContent = {
    get value() {
      return $formData.enContent.particularities ?? ''
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
      $formData.enContent.particularities = newValue
    }
  }
</script>

<div class="space-y-8">
  <div class="space-y-4">
    <div class="space-y-2 border-b pb-4">
      <h3 class="text-lg font-medium text-foreground">Besonderheiten</h3>
      <p class="text-sm text-muted-foreground">
        Besondere Hinweise und Informationen zu dem Modul.
      </p>
      <MarkdownHint />
      <MarkdownHelp />
    </div>
  </div>

  <div class="space-y-4">
    <MarkdownEditor
      {form}
      name="deContent.particularities"
      label="Deutsch"
      description="Die besonderen Hinweise und Informationen des Moduls in deutscher Sprache."
      bind:value={deContent.value}
      {errors}
      modificationStatus={deContentStatus}
    />

    <MarkdownEditor
      {form}
      name="enContent.particularities"
      label="English"
      description="The particularities of the module in English."
      bind:value={enContent.value}
      {errors}
      modificationStatus={enContentStatus}
    />
  </div>
</div>
