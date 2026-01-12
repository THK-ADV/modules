<script lang="ts">
  import MarkdownEditor from '$lib/components/markdown-editor.svelte'
  import MarkdownHelp from '$lib/components/markdown-help.svelte'
  import MarkdownHint from '$lib/components/markdown-hint.svelte'
  import { getModuleFormContext } from '../context'
  import type { PageProps } from './$types'

  const { data }: PageProps = $props()

  // svelte-ignore state_referenced_locally
  const deContentStatus = data.fieldStatuses?.['deContent.content']
  // svelte-ignore state_referenced_locally
  const enContentStatus = data.fieldStatuses?.['enContent.content']

  const form = getModuleFormContext()
  const { form: formData, errors } = form

  let deContent = {
    get value() {
      return $formData.deContent.content ?? ''
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
      $formData.deContent.content = newValue
    }
  }

  let enContent = {
    get value() {
      return $formData.enContent.content ?? ''
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
      $formData.enContent.content = newValue
    }
  }
</script>

<div class="space-y-8">
  <div class="space-y-4">
    <div class="space-y-2 border-b pb-4">
      <h3 class="text-foreground text-lg font-medium">Modulinhalte</h3>
      <p class="text-muted-foreground text-sm">
        Die konkreten Inhalte und Themen, die im Modul behandelt werden.
      </p>
      <MarkdownHint />
      <MarkdownHelp />
    </div>
  </div>

  <div class="space-y-4">
    <MarkdownEditor
      {form}
      name="deContent.content"
      label="Deutsch"
      description="Die Modulinhalte in deutscher Sprache."
      placeholder="- Grundlagen und Konzepte
- Praktische Anwendungen
- Übungen und Projekte"
      bind:value={deContent.value}
      {errors}
      modificationStatus={deContentStatus}
    />

    <MarkdownEditor
      {form}
      name="enContent.content"
      label="English"
      description="The module content in English."
      placeholder="- Fundamentals and concepts
- Practical applications
- Exercises and projects"
      bind:value={enContent.value}
      {errors}
      modificationStatus={enContentStatus}
    />
  </div>
</div>
