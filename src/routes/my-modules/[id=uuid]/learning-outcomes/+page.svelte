<script lang="ts">
  import MarkdownEditor from '$lib/components/markdown-editor.svelte'
  import MarkdownHelp from '$lib/components/markdown-help.svelte'
  import MarkdownHint from '$lib/components/markdown-hint.svelte'
  import { getModuleFormContext } from '../context'

  const form = getModuleFormContext()
  const { form: formData, errors } = form

  let deContent = {
    get value() {
      return $formData.deContent.learningOutcome ?? ''
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
      $formData.deContent.learningOutcome = newValue
    }
  }

  let enContent = {
    get value() {
      return $formData.enContent.learningOutcome ?? ''
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
      $formData.enContent.learningOutcome = newValue
    }
  }
</script>

<div class="space-y-8">
  <div class="space-y-4">
    <div class="space-y-2 border-b pb-4">
      <h3 class="text-lg font-medium text-foreground">Lernergebnisse (Learning Outcomes)</h3>
      <p class="text-sm text-muted-foreground">
        Die angestrebten Lernergebnisse des Moduls. Formulieren Sie die Lernziele präzise nach der <strong
          >"WAS", "WOMIT", "WOZU"</strong
        >-Struktur.
      </p>
      <MarkdownHint />
      <MarkdownHelp />
    </div>
  </div>

  <div class="space-y-4">
    <MarkdownEditor
      {form}
      name="deContent.learningOutcome"
      label="Deutsch"
      description="Die Learning Outcomes des Moduls in deutscher Sprache."
      placeholder="Die Studierenden sollen … (WAS) … (WOMIT) … (WOZU) …"
      bind:value={deContent.value}
      {errors}
    />

    <MarkdownEditor
      {form}
      name="enContent.learningOutcome"
      label="English"
      description="The Learning Outcomes of the module in English."
      placeholder="Students will be able to … (WHAT) … (WITH) … (WHY) …"
      bind:value={enContent.value}
      {errors}
    />
  </div>
</div>
