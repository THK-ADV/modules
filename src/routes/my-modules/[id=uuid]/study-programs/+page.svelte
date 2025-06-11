<script lang="ts">
  import StudyProgramElectiveRelationsForm from '$lib/components/forms/study-program-elective-relations-form.svelte'
  import StudyProgramMandatoryRelationsForm from '$lib/components/forms/study-program-mandatory-relations-form.svelte'
  import { moduleUpdateState } from '$lib/store.svelte'
  import { getModuleFormContext } from '../context'

  const studyPrograms = moduleUpdateState.studyPrograms

  const form = getModuleFormContext()
  const { form: formData, errors } = form
</script>

<div class="space-y-8">
  <div class="space-y-4">
    <div class="space-y-2 border-b pb-4">
      <h3 class="text-lg font-medium text-foreground">Studiengangszuordnung</h3>
      <p class="text-sm text-muted-foreground">
        Zuordnung des Moduls zu Studiengängen, in denen es als Pflicht- oder Wahlmodul gelehrt wird.
        Die Beziehungen werden in der Modulsuche, im Modulhandbuch, in den Prüfungslisten und im
        Studienplan verwendet.
      </p>
    </div>
  </div>

  <div class="space-y-4">
    <StudyProgramMandatoryRelationsForm
      {form}
      name="po.mandatory"
      {studyPrograms}
      bind:value={$formData.po.mandatory}
      {errors}
    />
  </div>

  <div class="space-y-4">
    <StudyProgramElectiveRelationsForm
      {form}
      name="po.optional"
      {studyPrograms}
      bind:value={$formData.po.optional}
      {errors}
    />
  </div>
</div>
