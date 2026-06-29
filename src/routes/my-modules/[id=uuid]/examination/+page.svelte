<script lang="ts">
  import AssessmentMethodsForm from '$lib/components/assessment-methods-form.svelte'
  import ComboboxField from '$lib/components/combobox.svelte'
  import MultiSelectCombobox from '$lib/components/multi-select-combobox.svelte'
  import { moduleUpdateState } from '$lib/stores/store.svelte.js'
  import { Info } from '@lucide/svelte'
  import type { PageProps } from './$types'
  import { getModuleFormContext } from '../context'

  let { data }: PageProps = $props()

  const modulePermittedAssessmentMethodOptions = moduleUpdateState.assessmentMethods
    .filter(({ isRPO }) => isRPO)
    .map(({ id, deLabel }) => ({ id, label: deLabel }))

  const identityOptions = moduleUpdateState.identities.map(({ identity, label }) => ({
    id: identity.id,
    deLabel: label
  }))

  const form = getModuleFormContext()
  const { form: formData, errors } = form

  // ensure that module assessment methods are a subset of permitted assessment methods
  function validateAssessmentMethods() {
    // Superforms supports array-root paths at runtime, but excludes them from FormPathLeaves.
    void form.validate('assessmentMethods' as never)
  }

  // svelte-ignore state_referenced_locally
  const firstExaminerStatus = data.fieldStatuses?.firstExaminer
  // svelte-ignore state_referenced_locally
  const secondExaminerStatus = data.fieldStatuses?.secondExaminer
  // svelte-ignore state_referenced_locally
  const examPhasesStatus = data.fieldStatuses?.examPhases
  // svelte-ignore state_referenced_locally
  const assessmentMethodsStatus = data.fieldStatuses?.assessmentMethods
</script>

<div class="space-y-8">
  <div class="space-y-5">
    <div class="space-y-2 border-b pb-4">
      <h3 class="text-foreground text-lg font-medium">Prüfungsleistungen</h3>
      <p class="text-muted-foreground text-sm">
        Definition der Prüfungsformen, Prüfer und Prüfungsmodalitäten für das Modul.
      </p>
    </div>
  </div>

  <div class="space-y-5">
    <div class="space-y-2 border-b pb-4">
      <h4 class="text-foreground text-base font-medium">Prüfungsformen</h4>
      <p class="text-muted-foreground text-sm">
        Festlegung der grundsätzlich zulässigen und der im kommenden Semester verwendeten
        Prüfungsformen.
      </p>
    </div>

    <div class="space-y-6">
      <MultiSelectCombobox
        {form}
        name="permittedAssessmentMethods"
        label="Zulässige Prüfungsformen"
        description="Legt fest, welche Prüfungsformen laut Prüfungsordnung grundsätzlich für dieses Modul verwendet werden dürfen. Diese Auswahl bildet die Grundlage für die Prüfungsformen im kommenden Semester."
        options={modulePermittedAssessmentMethodOptions}
        bind:value={$formData.permittedAssessmentMethods}
        maxVisibleBadges={5}
        {errors}
        onValueChange={validateAssessmentMethods}
      />

      <AssessmentMethodsForm
        {form}
        name="assessmentMethods"
        label="Prüfungsformen im kommenden Semester"
        assessmentMethods={moduleUpdateState.assessmentMethods}
        permittedAssessmentMethods={$formData.permittedAssessmentMethods}
        bind:value={$formData.assessmentMethods}
        modificationStatus={assessmentMethodsStatus}
      />
    </div>
  </div>

  <div class="space-y-5">
    <div class="space-y-2 border-b pb-4">
      <h4 class="text-foreground text-base font-medium">Prüfer</h4>
      <p class="text-muted-foreground text-sm">
        Festlegung der Erst- und Zweitprüfer für die Prüfungsleistungen.
      </p>
    </div>

    <div class="space-y-5">
      <ComboboxField
        {form}
        name="firstExaminer"
        label="Erstprüfer*in"
        placeholder="Erstprüfer*in suchen…"
        description="Wird in den Prüfungslisten verwendet."
        options={identityOptions}
        bind:value={$formData.firstExaminer}
        {errors}
        modificationStatus={firstExaminerStatus}
      />

      <ComboboxField
        {form}
        name="secondExaminer"
        label="Zweitprüfer*in"
        placeholder="Zweitprüfer*in suchen…"
        description="Bei unbekannter bzw. ausstehender Angabe soll &bdquo;N.N.&ldquo; angegeben werden. Wird in den Prüfungslisten verwendet."
        options={identityOptions}
        bind:value={$formData.secondExaminer}
        {errors}
        modificationStatus={secondExaminerStatus}
      />
    </div>
  </div>

  <div class="space-y-5">
    <div class="space-y-2 border-b pb-4">
      <h4 class="text-foreground text-base font-medium">Prüfungsorganisation</h4>
      <p class="text-muted-foreground text-sm">
        Festlegung der möglichen Prüfungsphasen und zeitlichen Organisation.
      </p>
    </div>

    <div class="space-y-5">
      <MultiSelectCombobox
        {form}
        name="examPhases"
        label="Prüfungsphasen"
        description="Gibt an, in welchen Phasen die Prüfung grundsätzlich angeboten wird. Ist nicht beschränkt auf das kommende Semester. Wird in den Prüfungslisten verwendet."
        options={moduleUpdateState.examPhases}
        bind:value={$formData.examPhases}
        {errors}
        modificationStatus={examPhasesStatus}
      />
    </div>
  </div>
</div>
