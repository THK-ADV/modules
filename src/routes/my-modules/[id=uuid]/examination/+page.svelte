<script lang="ts">
  import AssessmentMethodsForm from '$lib/components/assessment-methods-form.svelte'
  import Combobox from '$lib/components/combobox.svelte'
  import MultiSelectCombobox from '$lib/components/multi-select-combobox.svelte'
  import { moduleUpdateState } from '$lib/store.svelte'
  import { getModuleFormContext } from '../context'

  const assessmentMethods = moduleUpdateState.assessmentMethods
  // TODO: get from backend
  const preconditions = [{ id: 'practical', label: 'Praktikum' }]

  const identityOptions = moduleUpdateState.identities.map(({ identity, label }) => ({
    id: identity.id,
    deLabel: label
  }))

  const form = getModuleFormContext()
  const { form: formData, errors } = form
</script>

<AssessmentMethodsForm
  {form}
  name="assessmentMethods"
  label="Prüfungsformen"
  {assessmentMethods}
  {preconditions}
  bind:value={$formData.assessmentMethods}
  {errors}
/>

<Combobox
  {form}
  name="firstExaminer"
  label="Erstprüfer*in"
  placeholder="Erstprüfer*in suchen…"
  description="Wird in den Prüfungslisten verwendet."
  options={identityOptions}
  bind:value={$formData.firstExaminer}
  {errors}
/>

<Combobox
  {form}
  name="secondExaminer"
  label="Zweitprüfer*in"
  placeholder="Zweitprüfer*in suchen…"
  description="Bei unbekannter bzw. ausstehender Angabe soll &bdquo;N.N.&ldquo; angegeben werden. Wird in den Prüfungslisten verwendet."
  options={identityOptions}
  bind:value={$formData.secondExaminer}
  {errors}
/>

<MultiSelectCombobox
  {form}
  name="examPhases"
  label="Prüfungsphasen"
  description="Gibt an, in welchen Phasen die Prüfung grundsätzlich angeboten wird. Ist nicht beschränkt auf das kommende Semester. Wird in den Prüfungslisten verwendet."
  options={moduleUpdateState.examPhases}
  bind:value={$formData.examPhases}
  {errors}
/>
